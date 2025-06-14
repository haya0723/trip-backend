const db = require('../../db');
const eventsService = require('../events/events.service'); // eventsServiceをインポート

// ホテル情報を整形するヘルパー関数
function formatHotelInfo(scheduleRow) {
  if (!scheduleRow) return null;
  if (scheduleRow.hotel_name || scheduleRow.hotel_address || scheduleRow.hotel_check_in_time || scheduleRow.hotel_check_out_time || scheduleRow.hotel_reservation_number || scheduleRow.hotel_notes) {
    return {
      name: scheduleRow.hotel_name,
      address: scheduleRow.hotel_address,
      checkInTime: scheduleRow.hotel_check_in_time,
      checkOutTime: scheduleRow.hotel_check_out_time,
      reservationNumber: scheduleRow.hotel_reservation_number,
      notes: scheduleRow.hotel_notes,
    };
  }
  return null;
}

// DBの行データからサービス層のスケジュールオブジェクトに変換 (イベント情報も含む)
async function mapRowToScheduleObject(row) { // asyncに変更
  if (!row) return null;
  const events = await eventsService.getEventsByScheduleId(row.id); // イベント情報を取得
  return {
    id: row.id,
    trip_id: row.trip_id,
    date: row.date,
    day_description: row.day_description,
    hotel_info: formatHotelInfo(row),
    events: events || [], // 取得したイベント情報を追加
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 新しい日毎スケジュールを作成する
 * @param {string} tripId - 旅程ID
 * @param {object} scheduleData - スケジュールデータ { date, day_description, hotel_info }
 * @returns {Promise<object>} 作成されたスケジュールオブジェクト
 */
async function createSchedule(tripId, scheduleData) {
  const { date, day_description, hotel_info = {} } = scheduleData;
  const query = `
    INSERT INTO public.schedules 
      (trip_id, date, day_description, hotel_name, hotel_address, hotel_check_in_time, hotel_check_out_time, hotel_reservation_number, hotel_notes)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const values = [
    tripId, date, day_description, 
    hotel_info.name, hotel_info.address, hotel_info.checkInTime, hotel_info.checkOutTime, 
    hotel_info.reservationNumber, hotel_info.notes
  ];
  
  try {
    const { rows } = await db.query(query, values);
    return mapRowToScheduleObject(rows[0]); // mapRowToScheduleObject は async なので await は不要 (呼び出し側で await する)
  } catch (error) {
    console.error('[DEBUG schedules.service.createSchedule] Error:', error);
    throw error;
  }
}

/**
 * 特定の旅程のすべての日毎スケジュールを取得する
 * @param {string} tripId - 旅程ID
 * @returns {Promise<Array<object>>} スケジュールオブジェクトの配列
 */
async function getSchedulesByTripId(tripId) {
  const query = `
    SELECT * FROM public.schedules 
    WHERE trip_id = $1 
    ORDER BY date ASC;
  `;
  try {
    const { rows } = await db.query(query, [tripId]);
    return Promise.all(rows.map(mapRowToScheduleObject)); // mapが非同期関数になったためPromise.allで待つ
  } catch (error) {
    console.error('[DEBUG schedules.service.getSchedulesByTripId] Error:', error);
    throw error;
  }
}

/**
 * 特定の日毎スケジュールをIDで取得する
 * @param {string} scheduleId - スケジュールID
 * @returns {Promise<object|null>} スケジュールオブジェクトまたはnull
 */
async function getScheduleById(scheduleId) {
  const query = `
    SELECT * FROM public.schedules 
    WHERE id = $1;
  `;
  try {
    const { rows } = await db.query(query, [scheduleId]);
    return mapRowToScheduleObject(rows[0]); // mapRowToScheduleObject は async なので await は不要 (呼び出し側で await する)
  } catch (error) {
    console.error('[DEBUG schedules.service.getScheduleById] Error:', error);
    throw error;
  }
}

/**
 * 特定の日毎スケジュールを更新する
 * @param {string} scheduleId - スケジュールID
 * @param {object} scheduleData - 更新するスケジュールデータ
 * @returns {Promise<object|null>} 更新されたスケジュールオブジェクトまたはnull
 */
async function updateScheduleById(scheduleId, scheduleData) {
  const { date, day_description, hotel_info = {} } = scheduleData;
  
  const setClauses = [];
  const values = [];
  let valueCount = 1;

  if (date !== undefined) { setClauses.push(`date = $${valueCount++}`); values.push(date); }
  if (day_description !== undefined) { setClauses.push(`day_description = $${valueCount++}`); values.push(day_description); }
  if (hotel_info.name !== undefined) { setClauses.push(`hotel_name = $${valueCount++}`); values.push(hotel_info.name); }
  if (hotel_info.address !== undefined) { setClauses.push(`hotel_address = $${valueCount++}`); values.push(hotel_info.address); }
  if (hotel_info.checkInTime !== undefined) { setClauses.push(`hotel_check_in_time = $${valueCount++}`); values.push(hotel_info.checkInTime); }
  if (hotel_info.checkOutTime !== undefined) { setClauses.push(`hotel_check_out_time = $${valueCount++}`); values.push(hotel_info.checkOutTime); }
  if (hotel_info.reservationNumber !== undefined) { setClauses.push(`hotel_reservation_number = $${valueCount++}`); values.push(hotel_info.reservationNumber); }
  if (hotel_info.notes !== undefined) { setClauses.push(`hotel_notes = $${valueCount++}`); values.push(hotel_info.notes); }

  if (setClauses.length === 0) {
    // 更新対象がない場合は、現在のスケジュール情報をイベント付きで再取得して返す
    const currentRow = await db.query('SELECT * FROM public.schedules WHERE id = $1', [scheduleId]);
    return mapRowToScheduleObject(currentRow.rows[0]);
  }

  const query = `
    UPDATE public.schedules 
    SET ${setClauses.join(', ')}
    WHERE id = $${valueCount++}
    RETURNING *;
  `;
  values.push(scheduleId);

  try {
    const { rows } = await db.query(query, values);
    return mapRowToScheduleObject(rows[0]); // mapRowToScheduleObject は async なので await は不要 (呼び出し側で await する)
  } catch (error) {
    console.error('[DEBUG schedules.service.updateScheduleById] Error:', error);
    throw error;
  }
}

/**
 * 特定の日毎スケジュールを削除する
 * @param {string} scheduleId - スケジュールID
 * @returns {Promise<object|null>} 削除されたスケジュールオブジェクトまたはnull
 */
async function deleteScheduleById(scheduleId) {
  const query = `
    DELETE FROM public.schedules 
    WHERE id = $1
    RETURNING *; 
  `;
  try {
    const { rows } = await db.query(query, [scheduleId]);
    // 削除された場合、関連イベントも削除される(DBのCASCADE制約による)ので、
    // mapRowToScheduleObject を通すと events は空配列になるはず
    return mapRowToScheduleObject(rows[0]); // mapRowToScheduleObject は async なので await は不要 (呼び出し側で await する)
  } catch (error) {
    console.error('[DEBUG schedules.service.deleteScheduleById] Error:', error);
    throw error;
  }
}

module.exports = {
  createSchedule,
  getSchedulesByTripId,
  getScheduleById,
  updateScheduleById,
  deleteScheduleById,
  mapRowToScheduleObject, 
  formatHotelInfo,      
};
