const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// ユーザー登録
router.post('/signup', authController.signup);

// ユーザーログイン (まだ未実装)
router.post('/login', authController.login);

module.exports = router;
