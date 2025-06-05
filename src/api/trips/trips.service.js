const db = require('../../db');

/**
 * 新しい旅程を作成する
 * @param {string} userId - ユーザーID
 * @param {object} tripData - 旅程データ { name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public }
 * @returns {Promise<object>} 作成された旅程オブジェクト
 */
async function createTrip(userId, tripData) {
  const { 
    name, 
    period_summary, 
    start_date, 
    end_date, 
    destinations, 
    status, 
    cover_image_url, 
    is_public = false // デフォルトは非公開
  } = tripData;

  const query = `
    INSERT INTO public.trips 
      (user_id, name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const values = [userId, name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public];
  
  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('[DEBUG trips.service.createTrip] Error creating trip:', error);
    throw error;
  }
}

/**
 * 特定のユーザーのすべての旅程を取得する
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array<object>>} 旅程オブジェクトの配列
 */
async function getTripsByUserId(userId) {
  const query = `
    SELECT * FROM public.trips 
    WHERE user_id = $1 
    ORDER BY start_date DESC, created_at DESC;
  `;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error('[DEBUG trips.service.getTripsByUserId] Error fetching trips:', error);
    throw error;
  }
}

/**
 * 特定の旅程をIDで取得する (ユーザーIDも検証)
 * @param {string} tripId - 旅程ID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object|null>} 旅程オブジェクトまたはnull
 */
async function getTripById(tripId, userId) {
  const query = `
    SELECT * FROM public.trips 
    WHERE id = $1 AND user_id = $2;
  `;
  try {
    const { rows } = await db.query(query, [tripId, userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[DEBUG trips.service.getTripById] Error fetching trip by ID:', error);
    throw error;
  }
}

/**
 * 特定の旅程を更新する (ユーザーIDも検証)
 * @param {string} tripId - 旅程ID
 * @param {string} userId - ユーザーID
 * @param {object} tripData - 更新する旅程データ (更新可能なフィールドのみ)
 * @returns {Promise<object|null>} 更新された旅程オブジェクトまたはnull (見つからない/権限なしの場合)
 */
async function updateTripById(tripId, userId, tripData) {
  const { 
    name, 
    period_summary, 
    start_date, 
    end_date, 
    destinations, 
    status, 
    cover_image_url, 
    is_public 
  } = tripData;

  // 更新するフィールドと値を動的に構築
  const setClauses = [];
  const values = [];
  let valueCount = 1;

  if (name !== undefined) { setClauses.push(`name = $${valueCount++}`); values.push(name); }
  if (period_summary !== undefined) { setClauses.push(`period_summary = $${valueCount++}`); values.push(period_summary); }
  if (start_date !== undefined) { setClauses.push(`start_date = $${valueCount++}`); values.push(start_date); }
  if (end_date !== undefined) { setClauses.push(`end_date = $${valueCount++}`); values.push(end_date); }
  if (destinations !== undefined) { setClauses.push(`destinations = $${valueCount++}`); values.push(destinations); }
  if (status !== undefined) { setClauses.push(`status = $${valueCount++}`); values.push(status); }
  if (cover_image_url !== undefined) { setClauses.push(`cover_image_url = $${valueCount++}`); values.push(cover_image_url); }
  if (is_public !== undefined) { setClauses.push(`is_public = $${valueCount++}`); values.push(is_public); }

  if (setClauses.length === 0) {
    // 更新するフィールドがない場合は、現在の情報をそのまま返すかエラーとする
    return getTripById(tripId, userId); 
  }

  // updated_at はトリガーで自動更新される
  const query = `
    UPDATE public.trips 
    SET ${setClauses.join(', ')}
    WHERE id = $${valueCount++} AND user_id = $${valueCount++}
    RETURNING *;
  `;
  values.push(tripId, userId);

  try {
    const { rows } = await db.query(query, values);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[DEBUG trips.service.updateTripById] Error updating trip:', error);
    throw error;
  }
}

/**
 * 特定の旅程を削除する (ユーザーIDも検証)
 * @param {string} tripId - 旅程ID
 * @param {string} userId - ユーザーID
 * @returns {Promise<object|null>} 削除された旅程オブジェクトまたはnull (見つからない/権限なしの場合)
 */
async function deleteTripById(tripId, userId) {
  const query = `
    DELETE FROM public.trips 
    WHERE id = $1 AND user_id = $2
    RETURNING *; 
  `;
  try {
    const { rows } = await db.query(query, [tripId, userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('[DEBUG trips.service.deleteTripById] Error deleting trip:', error);
    throw error;
  }
}

module.exports = {
  createTrip,
  getTripsByUserId,
  getTripById,
  updateTripById,
  deleteTripById,
};
