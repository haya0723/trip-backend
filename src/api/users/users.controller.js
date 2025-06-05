const userService = require('./users.service'); // users.serviceをインポート

// 認証されたユーザー自身のプロフィール情報を取得する
async function getMyProfile(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      // このケースは通常、認証ミドルウェアで処理されるはずだが念のため
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const userId = req.user.id;
    const userProfile = await userService.getUserProfileById(userId);

    if (!userProfile) {
      // DBにユーザーが存在しない場合 (トークンは有効だがDBから消えたなどレアケース)
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json(userProfile);
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
    const { nickname, bio, avatarUrl } = req.body;

    // 何も更新データがない場合はエラーまたは何もしない
    if (nickname === undefined && bio === undefined && avatarUrl === undefined) {
      return res.status(400).json({ error: 'No profile data provided for update.' });
    }

    // 更新するデータのみをprofileDataオブジェクトにまとめる
    const profileDataToUpdate = {};
    if (nickname !== undefined) profileDataToUpdate.nickname = nickname;
    if (bio !== undefined) profileDataToUpdate.bio = bio;
    if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl;

    const updatedProfile = await userService.updateUserProfile(userId, profileDataToUpdate);

    if (!updatedProfile) {
      // サービス層でエラーがスローされなかったが、何らかの理由で更新後のプロフィールが取得できなかった場合
      return res.status(500).json({ error: 'Failed to update profile or retrieve updated profile.' });
    }

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error in updateMyProfile controller:', error);
    res.status(500).json({ error: 'Internal server error while updating profile.' });
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile, // 追加
};
