const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// GCSクライアントを初期化
// GOOGLE_APPLICATION_CREDENTIALS 環境変数が設定されていれば、自動的に認証情報が使われる
// Cloud Run環境では、サービスアカウントに紐づく認証情報が自動で使われる
const storage = new Storage();
const bucketName = 'trip-app-avatars'; // ユーザーが指定したバケット名

/**
 * ファイルをGCSにアップロードし、公開URLを返す
 * @param {Express.Multer.File} file - multerによって処理されたファイルオブジェクト
 * @param {string} userId - アップロードしたユーザーのID (フォルダ分けなどに使用)
 * @returns {Promise<string>} アップロードされたファイルの公開URL
 */
async function uploadFileToGCS(file, userId) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const bucket = storage.bucket(bucketName);
  // ユニークなファイル名を生成 (例: avatars/userId/uuid-originalName.ext)
  const extension = path.extname(file.originalname);
  const uniqueFilename = `avatars/${userId}/${uuidv4()}-${Date.now()}${extension}`;
  const blob = bucket.file(uniqueFilename);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      // public: true, // オブジェクトを直接公開する場合 (バケットが公開設定なら不要な場合も)
      // contentType: file.mimetype, // 自動検出されることが多いが明示も可能
    });

    blobStream.on('error', (err) => {
      console.error('[DEBUG upload.service.uploadFileToGCS] GCS upload stream error:', err);
      reject(new Error(`Unable to upload file to GCS: ${err.message}`));
    });

    blobStream.on('finish', async () => {
      try {
        // オブジェクトを公開状態にする (バケットが均一アクセス制御でallUsersに閲覧権限があれば不要な場合も)
        // await blob.makePublic(); // 必要に応じてコメント解除または削除
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        console.log(`[DEBUG upload.service.uploadFileToGCS] File uploaded to GCS: ${publicUrl}`);
        resolve(publicUrl);
      } catch (err) {
        console.error('[DEBUG upload.service.uploadFileToGCS] Error making file public or getting URL:', err);
        reject(new Error(`Failed to make file public or get URL: ${err.message}`));
      }
    });

    blobStream.end(file.buffer);
  });
}

module.exports = {
  uploadFileToGCS,
};
