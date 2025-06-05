const db = require('../../db');

// DBの行データをイベントオブジェクトにマッピングするヘルパー関数
const mapRowToEventObject = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    time: row.time,
    name: row.name,
    category: row.category,
    description: row.description,
    location: {
      name: row.location_name,
      address: row.location_address,
      latitude: row.location_latitude ? parseFloat(row.location_latitude) : null,
      longitude: row.location_longitude ? parseFloat(row.location_longitude) : null,
    },
    estimatedDurationMinutes: row.estimated_duration_minutes,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// イベント作成
const createEvent = async (scheduleId, eventData) => {
  const {
    time,
    name,
    category,
    description,
    location, // オブジェクトとして受け取る
    estimatedDurationMinutes,
    type,
  } = eventData;

  const { name: location_name, address: location_address, latitude: location_latitude, longitude: location_longitude } = location || {};

  const result = await db.query(
    `INSERT INTO events (
      schedule_id, time, name, category, description,
      location_name, location_address, location_latitude, location_longitude,
      estimated_duration_minutes, type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      scheduleId, time, name, category, description,
      location_name, location_address, location_latitude, location_longitude,
      estimatedDurationMinutes, type,
    ]
  );
  return mapRowToEventObject(result.rows[0]);
};

// イベントをIDで取得
const getEventById = async (eventId, scheduleId) => {
  const result = await db.query(
    'SELECT * FROM events WHERE id = $1 AND schedule_id = $2',
    [eventId, scheduleId]
  );
  return mapRowToEventObject(result.rows[0]);
};

// スケジュールIDでイベント一覧を取得
const getEventsByScheduleId = async (scheduleId) => {
  const result = await db.query(
    'SELECT * FROM events WHERE schedule_id = $1 ORDER BY time ASC',
    [scheduleId]
  );
  return result.rows.map(mapRowToEventObject);
};

// イベント更新
const updateEvent = async (eventId, scheduleId, eventData) => {
  const {
    time,
    name,
    category,
    description,
    location,
    estimatedDurationMinutes,
    type,
  } = eventData;

  const { name: location_name, address: location_address, latitude: location_latitude, longitude: location_longitude } = location || {};

  const result = await db.query(
    `UPDATE events SET
      time = COALESCE($1, time),
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      description = COALESCE($4, description),
      location_name = COALESCE($5, location_name),
      location_address = COALESCE($6, location_address),
      location_latitude = COALESCE($7, location_latitude),
      location_longitude = COALESCE($8, location_longitude),
      estimated_duration_minutes = COALESCE($9, estimated_duration_minutes),
      type = COALESCE($10, type),
      updated_at = current_timestamp
    WHERE id = $11 AND schedule_id = $12
    RETURNING *`,
    [
      time, name, category, description,
      location_name, location_address, location_latitude, location_longitude,
      estimatedDurationMinutes, type,
      eventId, scheduleId,
    ]
  );
  return mapRowToEventObject(result.rows[0]);
};

// イベント削除
const deleteEvent = async (eventId, scheduleId) => {
  const result = await db.query(
    'DELETE FROM events WHERE id = $1 AND schedule_id = $2 RETURNING id',
    [eventId, scheduleId]
  );
  return result.rows[0] ? result.rows[0].id : null;
};

module.exports = {
  createEvent,
  getEventById,
  getEventsByScheduleId,
  updateEvent,
  deleteEvent,
};
