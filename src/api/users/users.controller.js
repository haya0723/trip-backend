const userService = require('./users.service'); // users.serviceをインポート

// 認証されたユーザー自身のプロフィール情報を取得する
async function getMyProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const userId = req.user.id;
    const userProfile = await userService.getUserProfileById(userId);

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // フロントエンドは avatarUrl (キャメルケース) を期待している可能性があるため、ここで変換する
    // ただし、userService.getUserProfileById が既にキャメルケースで返している場合は不要
    const profileToSend = { ...userProfile };
    if (profileToSend.avatar_url && profileToSend.avatarUrl === undefined) {
        profileToSend.avatarUrl = profileToSend.avatar_url;
        // delete profileToSend.avatar_url; // 必要に応じてスネークケースを削除
    }

    res.status(200).json(profileToSend);
  } catch (error) {
    console.error('Error in getMyProfile controller:', error);
    res.status(500).json({ error: 'Internal server error while fetching profile.' });
  }
}

// 認証されたユーザー自身のプロフィール情報を更新する
async function updateMyProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const userId = req.user.id;
    // フロントエンドからは avatar_url (スネークケース) で送信されることを期待
    const { nickname, bio, avatar_url } = req.body; 

    // 何も更新データがない場合はエラーまたは何もしない
    if (nickname === undefined && bio === undefined && avatar_url === undefined) {
      return res.status(400).json({ error: 'No profile data provided for update.' });
    }

    const profileDataToUpdate = {};
    if (nickname !== undefined) profileDataToUpdate.nickname = nickname;
    if (bio !== undefined) profileDataToUpdate.bio = bio;
    // avatar_url が null の場合も更新対象とする（画像を削除するケース）
    if (avatar_url !== undefined) profileDataToUpdate.avatar_url = avatar_url; 

    const updatedProfile = await userService.updateUserProfile(userId, profileDataToUpdate);

    if (!updatedProfile) {
      return res.status(500).json({ error: 'Failed to update profile or retrieve updated profile.' });
    }
    
    // フロントエンドは avatarUrl (キャメルケース) を期待している可能性があるため、ここで変換する
    const profileToSend = { ...updatedProfile };
    if (profileToSend.avatar_url && profileToSend.avatarUrl === undefined) {
        profileToSend.avatarUrl = profileToSend.avatar_url;
        // delete profileToSend.avatar_url;
    }

    res.status(200).json(profileToSend);
  } catch (error) {
    console.error('Error in updateMyProfile controller:', error);
    res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
};
