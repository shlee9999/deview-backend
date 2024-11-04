const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
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

exports.isAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send({ error: '관리자 권한이 필요합니다.' });
  }
  next();
};

exports.optional = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    req.user = decoded;
    next();
  });
};
