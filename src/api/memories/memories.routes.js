const express = require('express');
const memoriesController = require('./memories.controller');
const authenticateToken = require('../../middleware/authMiddleware'); // 分割代入をやめる

const router = express.Router();

// POST /api/memories - Create a new memory
router.post(
  '/', 
  authenticateToken, 
  memoriesController.createMemory 
);

// PUT /api/memories/:memoryId - Update a specific memory
router.put('/:memoryId', authenticateToken, memoriesController.updateMemory);

// 他のルート (GET, DELETE) もここに追加予定

module.exports = router;
