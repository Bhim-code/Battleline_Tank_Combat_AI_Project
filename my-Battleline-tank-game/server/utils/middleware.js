/* ============================================================
   utils/middleware.js — Express middleware
   ============================================================ */

const { verifyToken } = require('./auth');

/**
 * Protect any route that requires a logged-in user.
 * Reads the Bearer token from Authorization header,
 * verifies it, and attaches the decoded user to req.user.
 */
function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { protect };
