const db = require('../../db');

/**
 * ユーザーIDに基づいて完全なプロフィール情報を取得する
 * usersテーブルとuser_profilesテーブルを結合する
 * @param {string} userId - ユーザーID (UUID)
 * @returns {Promise<object|null>} プロフィール情報オブジェクトまたはnull
 */
async function getUserProfileById(userId) {
  // 問題切り分けのため、一時的にクエリを簡略化
  // const query = `
  //   SELECT 
  //     u.id, 
  //     u.nickname, 
  //     u.email, 
  //     u.created_at AS user_created_at, 
  //     u.updated_at AS user_updated_at
  //     // up.bio, // 一時的にコメントアウト
  //     // up.avatar_url, 
  //     // up.created_at AS profile_created_at,
  //     // up.updated_at AS profile_updated_at
  //   FROM 
  //     public.users u
  //   -- LEFT JOIN 
  //   --   public.user_profiles up ON u.id = up.user_id // 一時的にコメントアウト
  //   WHERE 
  //     u.id = $1;
  // `;
  // 元のクエリに戻し、スキーマ名を省略してみる（search_pathがpublicに設定されているため）
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
    console.log('[DEBUG users.service.getUserProfileById] Executing query:', query, 'with userId:', userId);
    const { rows } = await db.query(query, [userId]);
    console.log('[DEBUG users.service.getUserProfileById] Query result rows:', rows);
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
 * @param {object} profileData - 更新するプロフィールデータ { nickname, bio, avatar_url } (コントローラからスネークケースで渡される想定)
 * @returns {Promise<object>} 更新後のプロフィール情報
 */
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
        params.push(bio);
        columnsToInsert.push('bio');
        valuesToInsert.push(`$${valueIndex}`);
        setClauses.push(`bio = $${valueIndex++}`);
      }
      if (avatar_url !== undefined) {
        params.push(avatar_url);
        columnsToInsert.push('avatar_url');
        valuesToInsert.push(`$${valueIndex}`);
        setClauses.push(`avatar_url = $${valueIndex++}`);
      }
      
      if (setClauses.length > 0) {
        // created_at, updated_at を列リストとVALUES句に追加
        columnsToInsert.push('created_at', 'updated_at');
        valuesToInsert.push('current_timestamp', 'current_timestamp');

        const updateQuery = `
          INSERT INTO user_profiles (${columnsToInsert.join(', ')})
          VALUES (${valuesToInsert.join(', ')})
          ON CONFLICT (user_id)
          DO UPDATE SET
            ${setClauses.join(', ')},
            updated_at = current_timestamp
          RETURNING user_id, bio, avatar_url, updated_at;
        `;
         console.log('[DEBUG users.service.updateUserProfile] Dynamic UPSERT query:', updateQuery, 'Params:', params);
         await client.query(updateQuery, params);
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
