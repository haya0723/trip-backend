const express = require('express');
const multer = require('multer'); // multer のインポートのコメントアウトを解除
const uploadController = require('./upload.controller');
const authenticateToken = require('../../middleware/authMiddleware'); // 分割代入をやめる

const router = express.Router();

// POST /api/upload/media - Upload a single media file
router.post(
  '/media', 
  authenticateToken, 
  multer({ // multerミドルウェアのコメントアウトを解除し、直接定義
    storage: multer.memoryStorage(), 
    limits: { fileSize: 10 * 1024 * 1024 } 
  }).single('mediaFile'), 
  uploadController.handleFileUpload 
);

module.exports = router;
