const authService = require('./auth.service');

async function signup(req, res, next) {
  try {
    const { nickname, email, password } = req.body;

    // 簡単なバリデーション (本来はexpress-validatorなどを使うべき)
    if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Nickname, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // メールアドレスの重複チェック
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    // パスワードのハッシュ化
    const hashedPassword = await authService.hashPassword(password);

    // ユーザー作成
    const newUser = await authService.createUser(nickname, email, hashedPassword);

    // user_profilesテーブルにもレコードを作成 (サービス層で対応するか、ここで明示的に行うか)
    // await db.query('INSERT INTO user_profiles (user_id, bio, avatar_url) VALUES ($1, $2, $3)', [newUser.id, '', null]);
    // 今回はまずusersテーブルのみ

    // 成功レスポンス (実際のユーザー情報を返すか、メッセージのみにするか検討)
    // ここでは作成されたユーザー情報の一部を返す (パスワードハッシュは除く)
    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        nickname: newUser.nickname,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error('Error in signup controller:', error);
    // next(error); // グローバルエラーハンドラに渡す場合
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' }); // ユーザーが存在しない場合も同じエラーメッセージで統一
    }

    const isPasswordMatch = await authService.comparePassword(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = authService.generateToken(user);

    // ログイン成功レスポンス
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: { // パスワードハッシュは含めない
        id: user.id,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
}

module.exports = {
  signup,
  login,
};
