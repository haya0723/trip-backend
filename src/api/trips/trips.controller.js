const tripService = require('./trips.service');
const aiService = require('../../services/aiService'); // aiServiceをインポート
const schedulesService = require('../schedules/schedules.service'); // schedulesServiceをインポート

// 新しい旅程を作成
async function createTrip(req, res, next) {
  try {
    const userId = req.user.id; // authenticateTokenミドルウェアから取得
    const tripData = req.body;
    // TODO: tripDataのバリデーション (例: nameが必須など)
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
    const trip = await tripService.getTripById(tripId, userId);
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
    // TODO: tripDataのバリデーション
    const updatedTrip = await tripService.updateTripById(tripId, userId, tripData);
    if (!updatedTrip) {
      return res.status(404).json({ error: 'Trip not found or access denied for update.' });
    }
    res.status(200).json(updatedTrip);
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

    // 旅程の基本情報を取得
    const trip = await tripService.getTripById(tripId, userId); // スケジュールを含まない基本情報でOK
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied.' });
    }

    // AIサービスにスケジュール生成をリクエスト
    const generatedSchedules = await aiService.generateSchedulesFromTrip(trip);
    
    // 生成されたスケジュールをデータベースに保存
    // 既存のスケジュールを削除してから追加するか、マージするかは要件による
    // ここではシンプルに、既存のスケジュールを削除せずに追加する（重複の可能性あり）
    // または、AI生成前に既存スケジュールをクリアするロジックを追加することも検討
    for (const scheduleData of generatedSchedules) {
      const newSchedule = await schedulesService.createSchedule(tripId, scheduleData);
      // 各スケジュール内のイベントも保存する必要がある場合、schedulesService.createSchedule内で処理するか、別途ループ
      // 現状のaiServiceの戻り値はeventsを含むので、schedulesService.createScheduleでeventsも処理できる想定
    }

    // 更新された旅程全体（最新のスケジュールリストを含む）を返す
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
  generateSchedulesAI, // 追加
};
