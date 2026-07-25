const jwt = require('jsonwebtoken');

// Demo token for bypassing login (remove in production)
const DEMO_TOKEN = 'demo-token-bypass-login';
const DEMO_USER_ID = 'demo123';

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Bypass auth for demo token (development only)
  if (token === DEMO_TOKEN) {
    req.user = { id: DEMO_USER_ID, role: 'ca' };
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
