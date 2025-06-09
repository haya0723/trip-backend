const db = require('../../db');

async function getUserProfileById(userId) {
  const query = `
    SELECT 
      u.id, 
      u.nickname, 
      u.email, 
      u.created_at AS user_created_at, 
      u.updated_at AS user_updated_at,
      up.bio,
      up.avatar_url,
      up.created_at AS profile_created_at,
      up.updated_at AS profile_updated_at
    FROM 
      users u
    LEFT JOIN 
      user_profiles up ON u.id = up.user_id
    WHERE 
      u.id = $1;
  `;
  try {
    const { rows } = await db.query(query, [userId]);
    if (rows.length === 0) {
      return null;
    }
    const userProfileData = rows[0];
    console.log('[DEBUG users.service.getUserProfileById] Raw avatar_url from DB:', userProfileData.avatar_url); // ★ログ追加
    return {
      id: userProfileData.id,
      nickname: userProfileData.nickname,
      email: userProfileData.email,
      bio: userProfileData.bio,
      avatarUrl: userProfileData.avatar_url, // This should correctly be null if DB is null
      createdAt: userProfileData.user_created_at,
      updatedAt: userProfileData.user_updated_at,
    };
  } catch (error) {
    console.error('[DEBUG users.service.getUserProfileById] Error fetching user profile:', error);
    throw error;
  }
}

async function updateUserProfile(userId, profileData) {
  const { nickname, bio, avatar_url } = profileData; 
  const client = await db.pool.connect(); 
  try {
    await client.query('BEGIN');
    if (nickname !== undefined) {
      await client.query(
        'UPDATE users SET nickname = $1, updated_at = current_timestamp WHERE id = $2',
        [nickname, userId]
      );
    }
    if (bio !== undefined || avatar_url !== undefined) { 
      const params = [userId];
      let setClauses = [];
      let columnsToInsert = ['user_id'];
      let valuesToInsert = ['$1'];
      let valueIndex = 2;

      if (bio !== undefined) {
        params.push(bio); columnsToInsert.push('bio'); valuesToInsert.push(`$${valueIndex}`);
        setClauses.push(`bio = $${valueIndex++}`);
      }
      if (avatar_url !== undefined) { // This handles null as well
        params.push(avatar_url); columnsToInsert.push('avatar_url'); valuesToInsert.push(`$${valueIndex}`);
        setClauses.push(`avatar_url = $${valueIndex++}`);
      }
      
      if (setClauses.length > 0) {
        columnsToInsert.push('created_at', 'updated_at');
        valuesToInsert.push('current_timestamp', 'current_timestamp');

        const upsertQuery = `
          INSERT INTO user_profiles (${columnsToInsert.join(', ')})
          VALUES (${valuesToInsert.join(', ')})
          ON CONFLICT (user_id)
          DO UPDATE SET
            ${setClauses.join(', ')},
            updated_at = current_timestamp
          RETURNING user_id, bio, avatar_url, updated_at;
        `;
         const upsertResult = await client.query(upsertQuery, params);
         console.log('[DEBUG users.service.updateUserProfile] UPSERT result:', upsertResult.rows[0]); // ★ログ追加
      }
    }
    await client.query('COMMIT');
    return getUserProfileById(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DEBUG users.service.updateUserProfile] Error during transaction, ROLLBACK successful:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getUserProfileById,
  updateUserProfile,
};
