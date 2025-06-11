const { Pool } = require('pg');
require('dotenv').config(); // .envファイルから環境変数を読み込む

let dbConfig;

if (process.env.NODE_ENV === 'production' && process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME) {
  // Cloud Run (本番環境) でUnixソケットを使用する場合
  dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: `/cloudsql/${process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME}`,
    // port はUnixソケットの場合、通常は不要
  };
  console.log('Using Unix socket for DB connection in production.');
} else {
  // ローカル開発環境 (TCP接続)
  dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
    // ローカル開発でSSLが必要な場合はここに追加
    // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
  console.log(`Using TCP for DB connection. Host: ${dbConfig.host}, Port: ${dbConfig.port}`);
}

const pool = new Pool(dbConfig);

pool.on('connect', (client) => {
  client.query('SET search_path TO public;')
    .then(() => console.log('Search path set to public for new client connection.'))
    .catch(err => console.error('Error setting search_path for new client', err));
  console.log('Connected to the PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool, // プール自体もエクスポートして、トランザクションなどで使えるようにする
};
