const db = require('../db');

async function adminMiddleware(req, res, next) {
  const { rows } = await db.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = adminMiddleware;
