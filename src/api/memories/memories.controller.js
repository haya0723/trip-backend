const memoryService = require('./memories.service');
// TODO: 必要に応じて tripService や eventService をインポートして所有権検証を行う

async function createMemory(req, res, next) {
  try {
    const userId = req.user.id; // authenticateTokenミドルウェアから取得
    const memoryData = req.body; 

    // TODO: memoryData のバリデーション (例: event_id または trip_id が存在し、かつ有効か)
    // 例えば、event_id が指定された場合、そのイベントが本当にこのユーザーの旅程に属するか検証するなど。
    // trip_id が指定された場合も同様。

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

// 他のコントローラ関数 (get, update, delete) もここに追加予定

module.exports = {
  createMemory,
  // getMemories, (旅程やイベントに紐づく思い出一覧を取得する想定)
  // updateMemory,
  // deleteMemory,
};
