const { Pool } = require('pg');
require('dotenv').config(); // .envファイルから環境変数を読み込む

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

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
