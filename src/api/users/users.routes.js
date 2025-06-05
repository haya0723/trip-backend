const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const authenticateToken = require('../../middleware/authMiddleware'); // 認証ミドルウェアをインポート

// GET /api/users/profile - 認証されたユーザーのプロフィール情報を取得
router.get('/profile', authenticateToken, usersController.getMyProfile);

// PUT /api/users/profile - 認証されたユーザーのプロフィール情報を更新
router.put('/profile', authenticateToken, usersController.updateMyProfile);

// 他のユーザー関連ルートはここに追加

module.exports = router;
