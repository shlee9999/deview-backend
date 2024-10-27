const jwt = require('jsonwebtoken');

function optionalJwtMiddleware(req, res, next) {
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
}

module.exports = optionalJwtMiddleware;
