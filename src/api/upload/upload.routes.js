const express = require('express');
const uploadController = require('./upload.controller');
const { authenticateToken } = require('../../middleware/authMiddleware'); // 認証ミドルウェア

const router = express.Router();

// POST /api/upload/media - Upload a single media file
router.post(
  '/media', 
  authenticateToken, // Requires authentication
  uploadController.uploadMiddleware, // Multer middleware for single file upload with field name 'mediaFile'
  uploadController.handleFileUpload   // Controller function to handle the upload
);

module.exports = router;
