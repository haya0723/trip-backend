const express = require('express');
const router = express.Router();
const tripsController = require('./trips.controller');
const authenticateToken = require('../../middleware/authMiddleware');
const schedulesRouter = require('../schedules/schedules.routes'); // schedulesRouterをインポート
const memoriesController = require('../memories/memories.controller'); // memoriesControllerをインポート

// すべての /api/trips ルートに認証ミドルウェアを適用
router.use(authenticateToken);

// POST /api/trips - 新しい旅程を作成
router.post('/', tripsController.createTrip);

// GET /api/trips - 認証されたユーザーの旅程一覧を取得
router.get('/', tripsController.getMyTrips);

// GET /api/trips/:tripId - 特定の旅程を取得
router.get('/:tripId', tripsController.getTrip);

// PUT /api/trips/:tripId - 特定の旅程を更新
router.put('/:tripId', tripsController.updateTrip);

// DELETE /api/trips/:tripId - 特定の旅程を削除
router.delete('/:tripId', tripsController.deleteTrip);

// POST /api/trips/:tripId/generate-schedules-ai - AIによるスケジュール生成をトリガー
router.post('/:tripId/generate-schedules-ai', tripsController.generateSchedulesAI);

// ネストされたSchedulesルートをマウント
// /api/trips/:tripId/schedules へのリクエストをschedulesRouterに流す
router.use('/:tripId/schedules', schedulesRouter);

// GET /api/trips/:tripId/memories - 特定の旅程の思い出一覧を取得
router.get('/:tripId/memories', memoriesController.getMemoriesByTrip);

module.exports = router;
