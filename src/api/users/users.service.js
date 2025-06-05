const db = require('../../db');

/**
 * ユーザーIDに基づいて完全なプロフィール情報を取得する
 * usersテーブルとuser_profilesテーブルを結合する
 * @param {string} userId - ユーザーID (UUID)
 * @returns {Promise<object|null>} プロフィール情報オブジェクトまたはnull
 */
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
      public.users u
    LEFT JOIN 
      public.user_profiles up ON u.id = up.user_id
    WHERE 
      u.id = $1;
  `;
  try {
    const { rows } = await db.query(query, [userId]);
    if (rows.length === 0) {
      return null;
    }
    const userProfileData = rows[0];
    return {
      id: userProfileData.id,
      nickname: userProfileData.nickname,
      email: userProfileData.email,
      bio: userProfileData.bio,
      avatarUrl: userProfileData.avatar_url,
      createdAt: userProfileData.user_created_at,
      updatedAt: userProfileData.user_updated_at,
    };
  } catch (error) {
    console.error('[DEBUG users.service.getUserProfileById] Error fetching user profile:', error);
    throw error;
  }
}

/**
 * ユーザープロフィール情報を更新する
 * @param {string} userId - 更新するユーザーのID
 * @param {object} profileData - 更新するプロフィールデータ { nickname, bio, avatarUrl }
 * @returns {Promise<object>} 更新後のプロフィール情報
 */
async function updateUserProfile(userId, profileData) {
  const { nickname, bio, avatarUrl } = profileData;
  const client = await db.pool.connect(); 

  try {
    console.log(`[DEBUG users.service.updateUserProfile] Starting transaction for userId: ${userId}`);
    await client.query('BEGIN');
    console.log('[DEBUG users.service.updateUserProfile] BEGIN transaction successful.');

    if (nickname !== undefined) {
      console.log(`[DEBUG users.service.updateUserProfile] Updating nickname for userId: ${userId} to: ${nickname}`);
      const nicknameUpdateResult = await client.query(
        'UPDATE public.users SET nickname = $1, updated_at = current_timestamp WHERE id = $2 RETURNING nickname',
        [nickname, userId]
      );
      console.log('[DEBUG users.service.updateUserProfile] Nickname update result:', nicknameUpdateResult.rows);
    }

    if (bio !== undefined || avatarUrl !== undefined) {
      console.log(`[DEBUG users.service.updateUserProfile] Upserting user_profiles for userId: ${userId} with bio: ${bio}, avatarUrl: ${avatarUrl}`);
      const upsertQuery = `
        INSERT INTO public.user_profiles (user_id, bio, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, current_timestamp, current_timestamp)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          bio = EXCLUDED.bio, 
          avatar_url = EXCLUDED.avatar_url,
          updated_at = current_timestamp
        RETURNING user_id, bio, avatar_url, updated_at; 
      `;
      // COALESCEを削除し、提供された値で常に上書きするように変更 (nullならnullで上書き)
      const upsertResult = await client.query(upsertQuery, [userId, bio, avatarUrl]);
      console.log('[DEBUG users.service.updateUserProfile] UPSERT user_profiles result:', upsertResult.rows);
    }

    console.log('[DEBUG users.service.updateUserProfile] Attempting to COMMIT transaction.');
    await client.query('COMMIT');
    console.log('[DEBUG users.service.updateUserProfile] COMMIT transaction successful.');

    return getUserProfileById(userId);

  } catch (error) {
    console.error('[DEBUG users.service.updateUserProfile] Error during transaction, attempting ROLLBACK:', error);
    await client.query('ROLLBACK');
    console.error('[DEBUG users.service.updateUserProfile] ROLLBACK successful.');
    throw error;
  } finally {
    client.release();
    console.log('[DEBUG users.service.updateUserProfile] Client released.');
  }
}

module.exports = {
  getUserProfileById,
  updateUserProfile,
};
