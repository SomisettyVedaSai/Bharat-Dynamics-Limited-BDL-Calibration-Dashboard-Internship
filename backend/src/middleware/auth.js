const jwt = require('jsonwebtoken');

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/api/health'];

function authMiddleware(req, res, next) {
  if (PUBLIC_PATHS.some((p) => req.path === p || req.originalUrl.endsWith(p))) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server auth not configured' });
    }
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
