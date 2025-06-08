console.log('テスト0');
console.log('Starting application...'); // 起動開始ログ
try {
  require('dotenv').config();
  console.log('テスト3');
  console.log('dotenv configured.');
  const express = require('express');
  console.log('express required.');
  const cors = require('cors');
  console.log('cors required.');
  const db = require('./db');
  console.log('db module required.');

  console.log('テスト4');
  const app = express();
  const port = process.env.PORT || 3001;
  console.log('テスト5');

  // CORSミドルウェアを使用 (すべてのオリジンを許可 - 開発用)
  app.use(cors());
  console.log('CORS middleware initialized and allowing all origins.');

  app.use(express.json()); // JSONリクエストボディをパースするため

  // ヘルスチェックエンドポイント
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // DB接続テストエンドポイント
  app.get('/db-test', async (req, res) => {
    try {
      const { rows } = await db.query('SELECT NOW()');
      res.status(200).json({ serverTime: rows[0].now });
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).json({ error: 'Failed to connect to database' });
    }
  });

  // APIルーターのマウント
  const authRoutes = require('./api/auth/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes mounted on /api/auth');

  const userRoutes = require('./api/users/users.routes'); // ユーザールートをインポート
  app.use('/api/users', userRoutes); // ユーザールートをマウント
  console.log('User routes mounted on /api/users');

  const uploadRoutes = require('./api/upload/upload.routes'); // アップロードルートのコメントアウトを解除
  app.use('/api/upload', uploadRoutes); // アップロードルートのコメントアウトを解除
  console.log('Upload routes mounted on /api/upload');

  const tripsRoutes = require('./api/trips/trips.routes'); // 旅程ルートをインポート
  app.use('/api/trips', tripsRoutes); // 旅程ルートをマウント
  console.log('Trips routes mounted on /api/trips');

  const memoriesRoutes = require('./api/memories/memories.routes'); // 思い出ルートは有効なまま
  app.use('/api/memories', memoriesRoutes); // 思い出ルートは有効なまま
  console.log('Memories routes mounted on /api/memories');

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
     console.log('テスト1');
  });

  // DockerコンテナがSIGINTやSIGTERMを受け取ったときに適切に終了するための処理
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    if (db && db.pool) {
      db.pool.end(() => {
        console.log('PostgreSQL pool has ended');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    if (db && db.pool) {
      db.pool.end(() => {
        console.log('PostgreSQL pool has ended');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
} catch (e) {
  console.error('Error during application startup:', e);
  process.exit(1); // 起動シーケンスでエラーがあれば終了
}
