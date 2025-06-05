const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const authenticateToken = require('../../middleware/authMiddleware');

// POST /api/upload/avatar - 認証されたユーザーのアバター画像をアップロード
router.post(
  '/avatar', 
  authenticateToken, 
  uploadController.uploadMiddleware, // multerミドルウェアで 'avatar' フィールドの単一ファイルを処理
  uploadController.uploadAvatar
);

module.exports = router;
