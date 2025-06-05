const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams: true で親ルーターのパラメータにアクセス可能に
const eventsController = require('./events.controller');
const authenticateToken = require('../../middleware/authMiddleware');
const { authorizeScheduleAccess } = require('../schedules/schedules.controller'); // authorizeScheduleAccessをインポート

// すべての /api/schedules/:scheduleId/events ルートに認証ミドルウェアとスケジュール権限ミドルウェアを適用
router.use(authenticateToken);
router.use(authorizeScheduleAccess); // scheduleIdの所有権を確認

// POST /api/schedules/:scheduleId/events - 新しいイベントを作成
router.post('/', eventsController.createEvent);

// GET /api/schedules/:scheduleId/events - 特定のスケジュールの日毎イベント一覧を取得
router.get('/', eventsController.getEventsBySchedule);

// GET /api/schedules/:scheduleId/events/:eventId - 特定のイベントを取得
router.get('/:eventId', eventsController.getEvent);

// PUT /api/schedules/:scheduleId/events/:eventId - 特定のイベントを更新
router.put('/:eventId', eventsController.updateEvent);

// DELETE /api/schedules/:scheduleId/events/:eventId - 特定のイベントを削除
router.delete('/:eventId', eventsController.deleteEvent);

module.exports = router;
