const express = require('express');
const multer = require('multer'); // multer を直接インポート
const uploadController = require('./upload.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// POST /api/upload/media - Upload a single media file
router.post(
  '/media', 
  authenticateToken, 
  multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 10 * 1024 * 1024 } 
  }).single('mediaFile'), // Define multer middleware directly here
  uploadController.handleFileUpload 
);

module.exports = router;
