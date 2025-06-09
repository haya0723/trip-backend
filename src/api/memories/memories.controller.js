const memoryService = require('./memories.service');
// const tripService = require('../trips/trips.service'); // TODO: 所有権検証のために必要
// const eventService = require('../events/events.service'); // TODO: 所有権検証のために必要

async function createMemory(req, res, next) {
  try {
    const userId = req.user.id; 
    const memoryData = req.body; 

    // TODO: memoryData のバリデーション
    // TODO: event_id や trip_id の所有権検証

    if (!memoryData.notes && (!memoryData.media_urls || memoryData.media_urls.length === 0)) {
      return res.status(400).json({ error: 'Memory must have notes or media.' });
    }
    
    const newMemory = await memoryService.createMemory(userId, memoryData);
    res.status(201).json(newMemory);
  } catch (error) {
    console.error('[DEBUG memories.controller.createMemory] Error:', error);
    if (error.message.includes('required') || error.message.includes('cannot be associated with both')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create memory.' });
  }
}

async function getMemoriesByTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params; 

    // TODO: tripId の所有権検証
    // const trip = await tripService.getTripByIdAndUser(tripId, userId);
    // if (!trip) {
    //   return res.status(404).json({ error: 'Trip not found or access denied.' });
    // }

    const memories = await memoryService.getMemoriesByTripId(tripId, userId);
    res.status(200).json(memories);
  } catch (error) {
    console.error('[DEBUG memories.controller.getMemoriesByTrip] Error:', error);
    res.status(500).json({ error: 'Failed to get memories for trip.' });
  }
}

async function getMemoriesByEvent(req, res, next) {
  try {
    const userId = req.user.id;
    // ネストされたルート /api/trips/:tripId/schedules/:scheduleId/events/:eventId/memories の場合、
    // eventId は req.params.eventId で取得できる。
    // もし /api/memories?event_id=... のようなクエリパラメータ形式なら req.query.event_id
    const { eventId } = req.params; 

    // TODO: eventId の所有権検証
    // const event = await eventService.getEventByIdAndUser(eventId, userId); 
    // if (!event) {
    //   return res.status(404).json({ error: 'Event not found or access denied.' });
    // }

    const memories = await memoryService.getMemoriesByEventId(eventId, userId);
    res.status(200).json(memories);
  } catch (error) {
    console.error('[DEBUG memories.controller.getMemoriesByEvent] Error:', error);
    res.status(500).json({ error: 'Failed to get memories for event.' });
  }
}

// 他のコントローラ関数 (update, delete) もここに追加予定

module.exports = {
  createMemory,
  getMemoriesByTrip,
  getMemoriesByEvent,
  // updateMemory,
  // deleteMemory,
};
