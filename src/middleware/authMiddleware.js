const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'Authentication token required.' }); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      return res.status(403).json({ error: 'Invalid token.' }); // Forbidden
    }
    req.user = user; // デコードされたユーザー情報をリクエストオブジェクトに格納
    next(); // 次のミドルウェアまたはルートハンドラへ
  });
}

module.exports = authenticateToken;
