const express = require('express');
const multer = require('multer'); // multer を直接インポート
const uploadController = require('./upload.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage directly in routes for testing
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } 
}).single('mediaFile');

// POST /api/upload/media - Upload a single media file
router.post(
  '/media', 
  authenticateToken, 
  uploadMiddleware, // Use locally defined middleware
  uploadController.handleFileUpload 
);

module.exports = router;
