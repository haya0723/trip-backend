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
      up.avatar_url, // DBからはavatar_urlで取得
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
    // フロントエンドの期待に合わせて avatarUrl (キャメルケース) で返す
    return {
      id: userProfileData.id,
      nickname: userProfileData.nickname,
      email: userProfileData.email,
      bio: userProfileData.bio,
      avatarUrl: userProfileData.avatar_url, // マッピング
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
  // コントローラから渡される profileData は avatar_url (スネークケース) を含む想定
  const { nickname, bio, avatar_url } = profileData; 
  const client = await db.pool.connect(); 

  try {
    console.log(`[DEBUG users.service.updateUserProfile] Starting transaction for userId: ${userId}`);
    await client.query('BEGIN');
    console.log('[DEBUG users.service.updateUserProfile] BEGIN transaction successful.');

    if (nickname !== undefined) {
      console.log(`[DEBUG users.service.updateUserProfile] Updating nickname for userId: ${userId} to: ${nickname}`);
      await client.query(
        'UPDATE public.users SET nickname = $1, updated_at = current_timestamp WHERE id = $2',
        [nickname, userId]
      );
    }

    // bio または avatar_url が提供された場合に user_profiles を更新
    // avatar_url が undefined でないことを確認 (null は許容し、DBでNULLに更新する)
    if (bio !== undefined || avatar_url !== undefined) { 
      console.log(`[DEBUG users.service.updateUserProfile] Upserting user_profiles for userId: ${userId} with bio: ${bio}, avatar_url: ${avatar_url}`);
      const upsertQuery = `
        INSERT INTO public.user_profiles (user_id, bio, avatar_url, created_at, updated_at)
        VALUES ($1, $2, $3, current_timestamp, current_timestamp)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          bio = COALESCE($2, user_profiles.bio), 
          avatar_url = $3, // avatar_url は提供された値で常に上書き (null も含む)
          updated_at = current_timestamp
        RETURNING user_id, bio, avatar_url, updated_at; 
      `;
      // bio は COALESCE を使用して、もし bio が undefined なら既存の値を維持するように変更も検討可能
      // ただし、コントローラで undefined の場合はキー自体を含めないようにしているので、
      // ここでは EXCLUDED を使わずに直接値をバインドする方がシンプルかもしれない。
      // 今回は、avatar_url は提供された値で上書き（null含む）、bioも同様とする。
      // もし bio が undefined の場合は、SQLクエリの $2 が undefined となりエラーになる可能性があるため、
      // profileDataToUpdate を作成するコントローラ側で、undefined のキーは含めないようにするのが良い。
      // ここでは、コントローラが avatar_url: undefined の場合はキー自体を送らないと仮定し、
      // avatar_url: null の場合は null で上書きされるようにする。
      // bio も同様。
      const params = [userId];
      let setClauses = [];
      let valueIndex = 2; // $1 は userId

      if (bio !== undefined) {
        params.push(bio);
        setClauses.push(`bio = $${valueIndex++}`);
      }
      if (avatar_url !== undefined) {
        params.push(avatar_url);
        setClauses.push(`avatar_url = $${valueIndex++}`);
      }
      
      if (setClauses.length > 0) {
        const updateQuery = `
          INSERT INTO public.user_profiles (user_id, ${setClauses.map(s => s.split(' =')[0]).join(', ')}, created_at, updated_at)
          VALUES ($1, ${params.slice(1).map((_,i) => `$${i+2}`).join(', ')}, current_timestamp, current_timestamp)
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
