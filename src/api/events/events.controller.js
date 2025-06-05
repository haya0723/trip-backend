const eventsService = require('./events.service');

// イベント作成
const createEvent = async (req, res, next) => {
  try {
    const { scheduleId } = req.params; // URLからscheduleIdを取得
    const eventData = req.body; // リクエストボディからイベントデータを取得

    // 必須フィールドのバリデーション
    if (!eventData.name) {
      return res.status(400).json({ error: 'Event name is required.' });
    }

    const newEvent = await eventsService.createEvent(scheduleId, eventData);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    next(error); // エラーハンドリングミドルウェアに渡す
  }
};

// 特定のイベントを取得
const getEvent = async (req, res, next) => {
  try {
    const { scheduleId, eventId } = req.params;
    const event = await eventsService.getEventById(eventId, scheduleId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    next(error);
  }
};

// スケジュールIDでイベント一覧を取得
const getEventsBySchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const events = await eventsService.getEventsByScheduleId(scheduleId);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error getting events by schedule ID:', error);
    next(error);
  }
};

// イベント更新
const updateEvent = async (req, res, next) => {
  try {
    const { scheduleId, eventId } = req.params;
    const eventData = req.body;

    const updatedEvent = await eventsService.updateEvent(eventId, scheduleId, eventData);

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found or not updated.' });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    next(error);
  }
};

// イベント削除
const deleteEvent = async (req, res, next) => {
  try {
    const { scheduleId, eventId } = req.params;
    const deletedEventId = await eventsService.deleteEvent(eventId, scheduleId);

    if (!deletedEventId) {
      return res.status(404).json({ error: 'Event not found or not deleted.' });
    }
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting event:', error);
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvent,
  getEventsBySchedule,
  updateEvent,
  deleteEvent,
};
