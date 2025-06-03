const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // jsonwebtokenをインポート
const db = require('../../db'); // DB接続モジュール

const SALT_ROUNDS = 10; // パスワードハッシュ化のソルトラウンド数
const JWT_SECRET = process.env.JWT_SECRET; // 環境変数からJWTシークレットを取得
const JWT_EXPIRES_IN = '1d'; // トークンの有効期限 (例: 1日)

/**
 * パスワードをハッシュ化する
 * @param {string} password - 平文のパスワード
 * @returns {Promise<string>} ハッシュ化されたパスワード
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * メールアドレスでユーザーを検索する
 * @param {string} email - 検索するメールアドレス
 * @returns {Promise<object|null>} ユーザーオブジェクトまたはnull
 */
async function findUserByEmail(email) {
  try {
    // デバッグ用: 実行直前のDB状態を確認
    const debugTime = await db.query('SELECT NOW() AS now, current_database() AS db, current_schema() AS schema, session_user, current_user');
    console.log('[DEBUG auth.service.findUserByEmail] DB State before query:', debugTime.rows[0]);
    const debugSearchPath = await db.query('SHOW search_path;');
    console.log('[DEBUG auth.service.findUserByEmail] Search Path before query:', debugSearchPath.rows[0]);
    const tableExistsDebug = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';");
    console.log('[DEBUG auth.service.findUserByEmail] users table in information_schema:', tableExistsDebug.rows);

    // スキーマを明示的に指定
    const { rows } = await db.query('SELECT * FROM public.users WHERE email = $1', [email]);
    return rows[0] || null;
  } catch (err) {
    console.error('[DEBUG auth.service.findUserByEmail] Error during findUserByEmail:', err);
    throw err; // エラーを再スローしてコントローラで処理
  }
}

/**
 * 新しいユーザーを作成する
 * @param {string} nickname - ニックネーム
 * @param {string} email - メールアドレス
 * @param {string} hashedPassword - ハッシュ化されたパスワード
 * @returns {Promise<object>} 作成されたユーザーオブジェクト (パスワードハッシュは除く)
 */
async function createUser(nickname, email, hashedPassword) {
  try {
    // デバッグ用: 実行直前のDB状態を確認
    const debugTime = await db.query('SELECT NOW() AS now, current_database() AS db, current_schema() AS schema, session_user, current_user');
    console.log('[DEBUG auth.service.createUser] DB State before query:', debugTime.rows[0]);
    const debugSearchPath = await db.query('SHOW search_path;');
    console.log('[DEBUG auth.service.createUser] Search Path before query:', debugSearchPath.rows[0]);
    const tableExistsDebug = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';");
    console.log('[DEBUG auth.service.createUser] users table in information_schema:', tableExistsDebug.rows);

    console.log(`[DEBUG auth.service.createUser] Attempting to insert user: { nickname: "${nickname}", email: "${email}" }`);
    // スキーマを明示的に指定
    const { rows } = await db.query(
      'INSERT INTO public.users (nickname, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nickname, email, created_at, updated_at',
      [nickname, email, hashedPassword]
    );
    console.log('[DEBUG auth.service.createUser] After INSERT query, rows:', rows);
    // user_profilesテーブルにも空のレコードを作成 (任意、トリガーで対応も可)
    // 今回はまずusersテーブルへの挿入のみ
    return rows[0];
  } catch (err) {
    console.error('[DEBUG auth.service.createUser] Error during createUser:', err);
    throw err; // エラーを再スローしてコントローラで処理
  }
}

/**
 * 提供されたパスワードとハッシュ化されたパスワードを比較する
 * @param {string} password - ユーザーが入力したパスワード
 * @param {string} hashedPassword - DBに保存されているハッシュ化パスワード
 * @returns {Promise<boolean>} パスワードが一致すればtrue、そうでなければfalse
 */
async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWTを生成する
 * @param {object} user - ユーザーオブジェクト (id, emailなどを含む)
 * @returns {string} 生成されたJWT
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    // 必要に応じて他の情報もペイロードに含める (例: nickname)
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = {
  hashPassword,
  findUserByEmail,
  createUser,
  comparePassword, // 追加
  generateToken,   // 追加
};
