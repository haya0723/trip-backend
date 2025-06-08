const express = require('express');
const memoriesController = require('./memories.controller');
const authenticateToken = require('../../middleware/authMiddleware'); // 分割代入をやめる

const router = express.Router();

// POST /api/memories - Create a new memory
router.post(
  '/', 
  authenticateToken, 
  // memoriesController.createMemory // 一時的にコメントアウト
  (req, res) => { res.status(501).send('Not Implemented - Test Handler Only with Auth, import fixed'); } 
);

// 他のルート (GET, PUT, DELETE) もここに追加予定

module.exports = router;
