const multer = require('multer');
const uploadService = require('./upload.service');

// Multer設定: メモリ内にファイルを保存 (小規模ファイル向け)
// 必要に応じてディスクストレージやファイルフィルタリングを追加
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 例: 5MBのファイルサイズ制限
  fileFilter: (req, file, cb) => {
    // 簡単な画像ファイル形式のフィルタリング (例)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// アバター画像をアップロードするコントローラ関数
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file type is invalid.' });
    }
    if (!req.user || !req.user.id) {
      // このルートは認証ミドルウェアで保護される前提
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const userId = req.user.id;
    const publicUrl = await uploadService.uploadFileToGCS(req.file, userId);
    
    res.status(200).json({ 
      message: 'Avatar uploaded successfully.',
      avatarUrl: publicUrl 
    });

  } catch (error) {
    console.error('Error in uploadAvatar controller:', error);
    if (error.message.startsWith('Invalid file type')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.startsWith('Unable to upload file to GCS') || error.message.startsWith('Failed to make file public')) {
        return res.status(500).json({ error: 'Failed to process file upload to storage.'});
    }
    res.status(500).json({ error: 'Internal server error during avatar upload.' });
  }
}

module.exports = {
  uploadMiddleware: upload.single('avatar'), // 'avatar' はフォームデータのフィールド名
  uploadAvatar,
};
