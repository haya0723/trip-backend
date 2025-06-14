const db = require('../../db');
const { mapRowToScheduleObject } = require('../schedules/schedules.service'); // インポート

/**
 * 新しい旅程を作成し、期間内の空のスケジュールも自動生成する
 * @param {string} userId - ユーザーID
 * @param {object} tripData - 旅程データ { name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public }
 * @returns {Promise<object>} 作成された旅程オブジェクト（スケジュールを含む）
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
    is_public = false 
  } = tripData;

  const client = await db.pool.connect(); 

  try {
    await client.query('BEGIN');

    const tripQuery = `
      INSERT INTO public.trips 
        (user_id, name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const tripValues = [userId, name, period_summary, start_date, end_date, destinations, status, cover_image_url, is_public];
    const { rows: tripRows } = await client.query(tripQuery, tripValues);
    const newTrip = tripRows[0];

    if (newTrip.start_date && newTrip.end_date) {
      let currentDate = new Date(newTrip.start_date);
      const finalEndDate = new Date(newTrip.end_date);
      const scheduleInsertQuery = `
        INSERT INTO public.schedules (trip_id, date, day_description) 
        VALUES ($1, $2, $3);
      `;
      let dayCount = 1;
      while (currentDate <= finalEndDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayDescription = `${dayCount}日目`;
        await client.query(scheduleInsertQuery, [newTrip.id, dateString, dayDescription]);
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
      }
    }

    await client.query('COMMIT');
    
    // getTripByIdWithSchedules は内部で mapRowToScheduleObject (async) を使うので await する
    return await getTripByIdWithSchedules(newTrip.id, userId, client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DEBUG trips.service.createTrip] Error creating trip with schedules:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 特定のユーザーのすべての旅程をスケジュール情報と共に取得する
 * @param {string} userId - ユーザーID
 * @returns {Promise<Array<object>>} 旅程オブジェクト（schedules配列を含む）の配列
 */
async function getTripsByUserId(userId) {
  const query = `
    SELECT * FROM public.trips 
    WHERE user_id = $1 
    ORDER BY start_date DESC, created_at DESC;
  `;
  try {
    const { rows: trips } = await db.query(query, [userId]);
    
    const tripsWithSchedules = await Promise.all(trips.map(async (trip) => {
      const schedulesQuery = `
        SELECT * FROM public.schedules 
        WHERE trip_id = $1 
        ORDER BY date ASC;
      `;
      const { rows: scheduleRows } = await db.query(schedulesQuery, [trip.id]);
      // mapRowToScheduleObject は async なので、ここも Promise.all で待つ
      const populatedSchedules = await Promise.all(scheduleRows.map(mapRowToScheduleObject));
      return { ...trip, schedules: populatedSchedules }; 
    }));
    
    return tripsWithSchedules;
  } catch (error) {
    console.error('[DEBUG trips.service.getTripsByUserId] Error fetching trips with schedules:', error);
    throw error;
  }
}

/**
 * 特定の旅程をIDで取得する (ユーザーIDも検証) - スケジュールは含まない
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
    // 更新がない場合は、スケジュール付きで現在の旅程を返す
    return getTripByIdWithSchedules(tripId, userId); 
  }

  const query = `
    UPDATE public.trips 
    SET ${setClauses.join(', ')}
    WHERE id = $${valueCount++} AND user_id = $${valueCount++}
    RETURNING *;
  `;
  values.push(tripId, userId);

  try {
    const { rows } = await db.query(query, values);
    if (rows.length > 0) {
      // 更新成功後、スケジュール付きで旅程を返す
      return getTripByIdWithSchedules(rows[0].id, userId);
    }
    return null;
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
    return rows.length > 0 ? rows[0] : null; // 削除された旅程情報を返す (スケジュールは含まない)
  } catch (error) {
    console.error('[DEBUG trips.service.deleteTripById] Error deleting trip:', error);
    throw error;
  }
}

/**
 * 特定の旅程をIDで取得し、関連するスケジュールもすべて取得する (ユーザーIDも検証)
 * @param {string} tripId - 旅程ID
 * @param {string} userId - ユーザーID (旅程の所有権検証のため)
 * @param {object} [queryRunner=db] - オプショナル: データベースクライアント (トランザクション用)
 * @returns {Promise<object|null>} 旅程オブジェクト（schedules配列を含む）またはnull
 */
async function getTripByIdWithSchedules(tripId, userId, queryRunner = db) {
  const tripQuery = `
    SELECT * FROM public.trips 
    WHERE id = $1 AND user_id = $2;
  `;
  const schedulesQuery = `
    SELECT * FROM public.schedules 
    WHERE trip_id = $1 
    ORDER BY date ASC; 
  `;

  try {
    const { rows: tripRows } = await queryRunner.query(tripQuery, [tripId, userId]);
    if (tripRows.length === 0) {
      return null; 
    }
    const trip = tripRows[0];
    console.log('[DEBUG trips.service.getTripByIdWithSchedules] Fetched trip:', trip);

    const { rows: scheduleRows } = await queryRunner.query(schedulesQuery, [tripId]);
    console.log('[DEBUG trips.service.getTripByIdWithSchedules] Fetched schedules (raw):', scheduleRows);
    // mapRowToScheduleObject は async なので、Promise.all で待つ
    trip.schedules = await Promise.all(scheduleRows.map(mapRowToScheduleObject)); 

    return trip;
  } catch (error) {
    console.error('[DEBUG trips.service.getTripByIdWithSchedules] Error fetching trip with schedules:', error);
    throw error;
  }
}

module.exports = {
  createTrip,
  getTripsByUserId,
  getTripById,
  updateTripById,
  deleteTripById,
  getTripByIdWithSchedules,
};
