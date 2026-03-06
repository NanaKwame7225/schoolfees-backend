const jwt = require('jsonwebtoken');

// Verify JWT on every protected route
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Only master admin can proceed
function requireMaster(req, res, next) {
  if (req.user?.role !== 'master') {
    return res.status(403).json({ error: 'Master admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireMaster };
