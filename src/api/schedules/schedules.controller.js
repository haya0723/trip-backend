const scheduleService = require('./schedules.service');
const tripService = require('../trips/trips.service'); // tripの所有権確認のため

// tripIdが現在のユーザーのものであるかを確認するミドルウェア的な関数
async function authorizeTripAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    if (!tripId) { 
        return res.status(400).json({ error: 'Trip ID is required.' });
    }
    const trip = await tripService.getTripById(tripId, userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or you do not have access to this trip.' });
    }
    req.trip = trip; 
    next();
  } catch (error) {
    console.error('[DEBUG schedules.controller.authorizeTripAccess] Error:', error);
    res.status(500).json({ error: 'Failed to authorize trip access.' });
  }
}

// scheduleIdが現在のユーザーの旅程のものであるかを確認するミドルウェア的な関数
async function authorizeScheduleAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const { scheduleId } = req.params;
    if (!scheduleId) {
        return res.status(400).json({ error: 'Schedule ID is required.' });
    }
    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found.' });
    }
    // スケジュールが属する旅程の所有権を確認
    const trip = await tripService.getTripById(schedule.trip_id, userId);
    if (!trip) {
      return res.status(403).json({ error: 'Access denied: Schedule does not belong to your trip or trip not found.' });
    }
    req.schedule = schedule; 
    req.trip = trip; 
    next();
  } catch (error) {
    console.error('[DEBUG schedules.controller.authorizeScheduleAccess] Error:', error);
    res.status(500).json({ error: 'Failed to authorize schedule access.' });
  }
}

// 新しい日毎スケジュールを作成
async function createSchedule(req, res, next) {
  try {
    const { tripId } = req.params; 
    const scheduleData = req.body;
    if (!scheduleData.date) {
      return res.status(400).json({ error: 'Schedule date is required.' });
    }
    await scheduleService.createSchedule(tripId, scheduleData);
    const updatedTrip = await tripService.getTripByIdWithSchedules(tripId, req.user.id);
    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found after creating schedule.' });
    }
    res.status(201).json(updatedTrip);
  } catch (error) {
    console.error('[DEBUG schedules.controller.createSchedule] Error:', error);
    res.status(500).json({ error: 'Failed to create schedule.' });
  }
}

// 特定の旅程の日毎スケジュール一覧を取得
async function getSchedules(req, res, next) {
  try {
    const { tripId } = req.params; 
    const schedules = await scheduleService.getSchedulesByTripId(tripId);
    res.status(200).json(schedules);
  } catch (error) {
    console.error('[DEBUG schedules.controller.getSchedules] Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
}

// 特定の日毎スケジュールを取得
async function getSchedule(req, res, next) {
  try {
    const { scheduleId } = req.params;
    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule || schedule.trip_id !== req.trip.id) { 
      return res.status(404).json({ error: 'Schedule not found or does not belong to this trip.' });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error('[DEBUG schedules.controller.getSchedule] Error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule.' });
  }
}

// 特定の日毎スケジュールを更新
async function updateSchedule(req, res, next) {
  try {
    const { scheduleId } = req.params;
    const scheduleData = req.body;
    
    const existingSchedule = await scheduleService.getScheduleById(scheduleId);
    if (!existingSchedule || existingSchedule.trip_id !== req.trip.id) { 
        return res.status(404).json({ error: 'Schedule not found or does not belong to this trip for update.' });
    }

    await scheduleService.updateScheduleById(scheduleId, scheduleData);
    const tripId = existingSchedule.trip_id; 
    const updatedTrip = await tripService.getTripByIdWithSchedules(tripId, req.user.id);
    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found after updating schedule.' });
    }
    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('[DEBUG schedules.controller.updateSchedule] Error:', error);
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
}

// 特定の日毎スケジュールを削除
async function deleteSchedule(req, res, next) {
  try {
    const { scheduleId } = req.params;

    const existingSchedule = await scheduleService.getScheduleById(scheduleId);
    if (!existingSchedule || existingSchedule.trip_id !== req.trip.id) { 
        return res.status(404).json({ error: 'Schedule not found or does not belong to this trip for deletion.' });
    }

    const deletedSchedule = await scheduleService.deleteScheduleById(scheduleId);
     if (!deletedSchedule) { 
        return res.status(404).json({ error: 'Failed to delete schedule or schedule not found after deletion attempt.'})
    }
    res.status(200).json({ message: 'Schedule deleted successfully.', deletedSchedule });
  } catch (error) {
    console.error('[DEBUG schedules.controller.deleteSchedule] Error:', error);
    res.status(500).json({ error: 'Failed to delete schedule.' });
  }
}

module.exports = {
  authorizeTripAccess, 
  authorizeScheduleAccess, // 新しくエクスポート
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};
