const express = require('express');
const memoriesController = require('./memories.controller');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// POST /api/memories - Create a new memory
router.post(
  '/', 
  authenticateToken, // Requires authentication
  memoriesController.createMemory
);

// 他のルート (GET, PUT, DELETE) もここに追加予定

module.exports = router;
