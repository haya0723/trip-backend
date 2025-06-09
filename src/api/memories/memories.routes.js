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

// DELETE /api/memories/:memoryId - Delete a specific memory
router.delete('/:memoryId', authenticateToken, memoriesController.deleteMemory);

// 他のルート (GET) もここに追加予定 (例: GET /:memoryId - 特定の思い出を取得)

module.exports = router;
