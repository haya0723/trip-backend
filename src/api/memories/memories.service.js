const db = require('../../db');

/**
 * Create a new memory.
 * @param {string} userId - The ID of the user creating the memory.
 * @param {object} memoryData - Data for the new memory.
 * @param {string} [memoryData.event_id] - Optional ID of the event this memory is associated with.
 * @param {string} [memoryData.trip_id] - Optional ID of the trip this memory is associated with (if not event-specific).
 * @param {string} [memoryData.notes] - Text notes for the memory.
 * @param {number} [memoryData.rating] - Rating for the memory (e.g., 1-5).
 * @param {string[]} [memoryData.media_urls] - Array of URLs for associated media (photos, videos).
 * @returns {Promise<object>} The created memory object.
 */
async function createMemory(userId, memoryData) {
  const { event_id, trip_id, notes, rating, media_urls } = memoryData;

  if (!userId) {
    throw new Error('User ID is required to create a memory.');
  }
  if (!event_id && !trip_id) {
    throw new Error('Either event_id or trip_id is required for a memory.');
  }
  if (event_id && trip_id) {
    throw new Error('Memory cannot be associated with both an event and a trip directly; choose one or link event to trip.');
  }

  const query = `
    INSERT INTO public.memories (user_id, event_id, trip_id, notes, rating, media_urls)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [userId, event_id || null, trip_id || null, notes, rating, media_urls || null];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('[DEBUG memories.service.createMemory] Error:', error);
    throw error;
  }
}

/**
 * Get all memories associated with a specific trip for a user.
 * @param {string} tripId - The ID of the trip.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object[]>} An array of memory objects.
 */
async function getMemoriesByTripId(tripId, userId) {
  if (!tripId || !userId) {
    throw new Error('Trip ID and User ID are required to fetch memories by trip.');
  }
  const query = `
    SELECT * FROM public.memories
    WHERE trip_id = $1 AND user_id = $2
    ORDER BY created_at DESC;
  `;
  try {
    const { rows } = await db.query(query, [tripId, userId]);
    return rows;
  } catch (error) {
    console.error('[DEBUG memories.service.getMemoriesByTripId] Error:', error);
    throw error;
  }
}

/**
 * Get all memories associated with a specific event for a user.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object[]>} An array of memory objects.
 */
async function getMemoriesByEventId(eventId, userId) {
  if (!eventId || !userId) {
    throw new Error('Event ID and User ID are required to fetch memories by event.');
  }
  const query = `
    SELECT * FROM public.memories
    WHERE event_id = $1 AND user_id = $2
    ORDER BY created_at DESC;
  `;
  try {
    const { rows } = await db.query(query, [eventId, userId]);
    return rows;
  } catch (error) {
    console.error('[DEBUG memories.service.getMemoriesByEventId] Error:', error);
    throw error;
  }
}

// 他のCRUD関数 (update, delete) もここに追加予定

module.exports = {
  createMemory,
  getMemoriesByTripId,
  getMemoriesByEventId,
  // updateMemoryById,
  // deleteMemoryById,
};
