require('dotenv').config(); // .envファイルから環境変数を読み込む

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "5432"),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // SSL設定の例 (必要に応じて調整)
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds', // シードファイルディレクトリ (今回は使用しないが念のため)
    },
  },

  production: {
    client: 'pg',
    connection: {
      host: `/cloudsql/${process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME}`, // Unixソケットパス
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // port はUnixソケットの場合不要なことが多いが、pgライブラリの挙動による
      // 必要であれば、Cloud SQL Proxyが使用するデフォルトポートなどを指定
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  }
};
