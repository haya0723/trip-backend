const scheduleService = require('./schedules.service');
const tripService = require('../trips/trips.service'); // tripの所有権確認のため

// tripIdが現在のユーザーのものであるかを確認するミドルウェア的な関数
async function authorizeTripAccess(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    if (!tripId) { // ルート定義でtripIdが必須なら不要だが念のため
        return res.status(400).json({ error: 'Trip ID is required.' });
    }
    const trip = await tripService.getTripById(tripId, userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or you do not have access to this trip.' });
    }
    req.trip = trip; // 後続のハンドラで使えるようにリクエストオブジェクトに格納
    next();
  } catch (error) {
    console.error('[DEBUG schedules.controller.authorizeTripAccess] Error:', error);
    res.status(500).json({ error: 'Failed to authorize trip access.' });
  }
}

// 新しい日毎スケジュールを作成
async function createSchedule(req, res, next) {
  try {
    const { tripId } = req.params; // authorizeTripAccessで検証済み
    const scheduleData = req.body;
    // TODO: scheduleDataのバリデーション (例: dateが必須など)
    if (!scheduleData.date) {
      return res.status(400).json({ error: 'Schedule date is required.' });
    }
    await scheduleService.createSchedule(tripId, scheduleData);
    // スケジュール追加後、更新された旅程全体（スケジュールリストを含む）を取得して返す
    const updatedTrip = await tripService.getTripByIdWithSchedules(tripId, req.user.id);
    if (!updatedTrip) {
      // 通常ここには来ないはずだが、念のため
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
    const { tripId } = req.params; // authorizeTripAccessで検証済み
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
    // const { tripId } = req.params; // authorizeTripAccessで検証済みだが、scheduleIdの所有権も確認
    const { scheduleId } = req.params;
    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule || schedule.trip_id !== req.trip.id) { // req.tripはauthorizeTripAccessでセット
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
    // TODO: scheduleDataのバリデーション
    
    // 先にscheduleを取得してtripIdが一致するか確認
    const existingSchedule = await scheduleService.getScheduleById(scheduleId);
    if (!existingSchedule || existingSchedule.trip_id !== req.trip.id) { // req.tripはauthorizeTripAccessでセット
        return res.status(404).json({ error: 'Schedule not found or does not belong to this trip for update.' });
    }

    await scheduleService.updateScheduleById(scheduleId, scheduleData);
    // スケジュール更新後、更新された旅程全体（スケジュールリストを含む）を取得して返す
    // existingSchedule.trip_id を使用して、更新対象のスケジュールが属する旅程のIDを取得
    const tripId = existingSchedule.trip_id; 
    const updatedTrip = await tripService.getTripByIdWithSchedules(tripId, req.user.id);
    if (!updatedTrip) {
      // 通常ここには来ないはずだが、念のため
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
    if (!existingSchedule || existingSchedule.trip_id !== req.trip.id) { // req.tripはauthorizeTripAccessでセット
        return res.status(404).json({ error: 'Schedule not found or does not belong to this trip for deletion.' });
    }

    const deletedSchedule = await scheduleService.deleteScheduleById(scheduleId);
     if (!deletedSchedule) { // deleteScheduleByIdがnullを返すのは通常エラー時だが念のため
        return res.status(404).json({ error: 'Failed to delete schedule or schedule not found after deletion attempt.'})
    }
    res.status(200).json({ message: 'Schedule deleted successfully.', deletedSchedule });
  } catch (error) {
    console.error('[DEBUG schedules.controller.deleteSchedule] Error:', error);
    res.status(500).json({ error: 'Failed to delete schedule.' });
  }
}

module.exports = {
  authorizeTripAccess, // ミドルウェアとしてエクスポート
  createSchedule,
  getSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};
