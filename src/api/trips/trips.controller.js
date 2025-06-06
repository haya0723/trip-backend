const tripService = require('./trips.service');
const aiService = require('../../services/aiService'); // aiServiceをインポート
const schedulesService = require('../schedules/schedules.service'); // schedulesServiceをインポート

// 新しい旅程を作成
async function createTrip(req, res, next) {
  try {
    const userId = req.user.id; // authenticateTokenミドルウェアから取得
    const tripData = req.body;
    if (!tripData.name) {
      return res.status(400).json({ error: 'Trip name is required.' });
    }
    const newTrip = await tripService.createTrip(userId, tripData);
    res.status(201).json(newTrip);
  } catch (error) {
    console.error('[DEBUG trips.controller.createTrip] Error:', error);
    res.status(500).json({ error: 'Failed to create trip.' });
  }
}

// 認証されたユーザーの旅程一覧を取得
async function getMyTrips(req, res, next) {
  try {
    const userId = req.user.id;
    const trips = await tripService.getTripsByUserId(userId);
    res.status(200).json(trips);
  } catch (error) {
    console.error('[DEBUG trips.controller.getMyTrips] Error:', error);
    res.status(500).json({ error: 'Failed to fetch trips.' });
  }
}

// 特定の旅程を取得
async function getTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const trip = await tripService.getTripByIdWithSchedules(tripId, userId); // getTripById を getTripByIdWithSchedules に変更
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied.' });
    }
    res.status(200).json(trip);
  } catch (error) {
    console.error('[DEBUG trips.controller.getTrip] Error:', error);
    res.status(500).json({ error: 'Failed to fetch trip.' });
  }
}

// 特定の旅程を更新
async function updateTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const tripData = req.body;
    const updatedTrip = await tripService.updateTripById(tripId, userId, tripData);
    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found or access denied for update.' });
    }
    // 更新後もスケジュールを含んだ旅程を返すように変更
    const tripWithSchedules = await tripService.getTripByIdWithSchedules(updatedTrip.id, userId);
    res.status(200).json(tripWithSchedules);
  } catch (error) {
    console.error('[DEBUG trips.controller.updateTrip] Error:', error);
    res.status(500).json({ error: 'Failed to update trip.' });
  }
}

// 特定の旅程を削除
async function deleteTrip(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const deletedTrip = await tripService.deleteTripById(tripId, userId);
    if (!deletedTrip) {
      return res.status(404).json({ error: 'Trip not found or access denied for deletion.' });
    }
    res.status(200).json({ message: 'Trip deleted successfully.', deletedTrip });
  } catch (error) {
    console.error('[DEBUG trips.controller.deleteTrip] Error:', error);
    res.status(500).json({ error: 'Failed to delete trip.' });
  }
}

// AIによるスケジュール生成をトリガー
async function generateSchedulesAI(req, res, next) {
  try {
    const userId = req.user.id;
    const { tripId } = req.params;
    const trip = await tripService.getTripById(tripId, userId); 
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied.' });
    }
    const generatedSchedules = await aiService.generateSchedulesFromTrip(trip);
    for (const scheduleData of generatedSchedules) {
      await schedulesService.createSchedule(tripId, scheduleData);
    }
    const updatedTrip = await tripService.getTripByIdWithSchedules(tripId, userId);
    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found after AI schedule generation.' });
    }
    res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('[DEBUG trips.controller.generateSchedulesAI] Error generating schedules with AI:', error);
    res.status(500).json({ error: 'Failed to generate schedules with AI.' });
  }
}

module.exports = {
  createTrip,
  getMyTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  generateSchedulesAI,
};
