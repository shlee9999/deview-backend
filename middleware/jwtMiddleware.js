const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ message: '토큰이 제공되지 않았습니다.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: '토큰이 만료되었습니다. 다시 로그인해 주세요.',
          error: 'TOKEN_EXPIRED',
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: '유효하지 않은 토큰입니다.',
          error: 'INVALID_TOKEN',
        });
      }
      return res.status(401).json({
        message: '인증에 실패했습니다.',
        error: 'AUTH_FAILED',
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
