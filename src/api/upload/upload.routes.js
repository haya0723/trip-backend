const express = require('express');
// const multer = require('multer'); // multer のインポートを一時的にコメントアウト
const uploadController = require('./upload.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// POST /api/upload/media - Upload a single media file
router.post(
  '/media', 
  authenticateToken, 
  // multer({...}).single('mediaFile'), // multerミドルウェアを一時的にコメントアウト
  uploadController.handleFileUpload 
);

module.exports = router;
