const axios = require('axios');

// AIサービスのAPIキーとエンドポイントは環境変数から取得することを推奨
// 例: process.env.AI_API_KEY, process.env.AI_API_URL
// ここでは仮の値を設定
const AI_API_URL = process.env.AI_API_URL || 'https://api.example.com/ai-schedule-generator';
const AI_API_KEY = process.env.AI_API_KEY || 'YOUR_AI_API_KEY'; // 実際のAPIキーに置き換える

/**
 * AIモデルに旅程情報からスケジュールを生成させる
 * @param {object} tripData - 旅程の基本情報 (name, start_date, end_date, destinationsなど)
 * @returns {Promise<Array<object>>} AIが生成したスケジュール案の配列
 */
async function generateSchedulesFromTrip(tripData) {
  try {
    // AIモデルへのリクエストペイロードを構築
    // AIモデルが理解しやすいように、旅程データを整形して渡す
    const payload = {
      trip_name: tripData.name,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      destinations: tripData.destinations,
      period_summary: tripData.period_summary,
      // 必要に応じて、ユーザーの好みや過去の旅行履歴なども含める
      user_preferences: {} // 例: userProfile.preferences など
    };

    console.log('[aiService] Sending request to AI API with payload:', payload);

    // AI APIへのリクエスト
    const response = await axios.post(AI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}` // APIキーが必要な場合
      }
    });

    console.log('[aiService] Received response from AI API:', response.data);

    // AIのレスポンスからスケジュールデータを抽出し、整形
    // AIのレスポンス形式に依存するため、ここでは仮の整形ロジック
    const generatedSchedules = response.data.schedules || []; // AIがschedulesプロパティで返すことを想定

    // 生成されたスケジュールがデータベースのスキーマに合うようにさらに整形が必要な場合がある
    // 例: 日付形式の変換、イベントのカテゴリやタイプへのマッピングなど
    const formattedSchedules = generatedSchedules.map(schedule => ({
      date: schedule.date, // YYYY-MM-DD形式を想定
      day_description: schedule.day_description,
      // その他のスケジュール関連フィールド
      events: (schedule.events || []).map(event => ({
        time: event.time, // HH:MM形式を想定
        name: event.name,
        description: event.description,
        category: event.category,
        estimated_duration_minutes: event.estimatedDurationMinutes, // DBカラム名に合わせる
        type: event.type,
        // その他のイベント関連フィールド
      }))
    }));

    return formattedSchedules;
  } catch (error) {
    console.error('[aiService] Error generating schedules from AI:', error.response ? error.response.data : error.message);
    throw new Error('Failed to generate schedules from AI.');
  }
}

module.exports = {
  generateSchedulesFromTrip
};
