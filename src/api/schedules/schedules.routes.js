const express = require('express');
// tripId パラメータを親ルーターから引き継ぐために mergeParams: true を設定
const router = express.Router({ mergeParams: true }); 
const schedulesController = require('./schedules.controller');
const authenticateToken = require('../../middleware/authMiddleware');
const eventsRouter = require('../events/events.routes'); // eventsRouterをインポート

// このルーターのすべてのルートに適用するミドルウェア
router.use(authenticateToken); // まず認証
router.use(schedulesController.authorizeTripAccess); // 次にtripIdの所有権確認

// POST /api/trips/:tripId/schedules - 新しい日毎スケジュールを作成
router.post('/', schedulesController.createSchedule);

// GET /api/trips/:tripId/schedules - 特定の旅程の日毎スケジュール一覧を取得
router.get('/', schedulesController.getSchedules);

// GET /api/trips/:tripId/schedules/:scheduleId - 特定の日毎スケジュールを取得
router.get('/:scheduleId', schedulesController.getSchedule);

// PUT /api/trips/:tripId/schedules/:scheduleId - 特定の日毎スケジュールを更新
router.put('/:scheduleId', schedulesController.updateSchedule);

// DELETE /api/trips/:tripId/schedules/:scheduleId - 特定の日毎スケジュールを削除
router.delete('/:scheduleId', schedulesController.deleteSchedule);

// ネストされたEventsルートをマウント
// /api/schedules/:scheduleId/events へのリクエストをeventsRouterに流す
router.use('/:scheduleId/events', eventsRouter);

module.exports = router;
