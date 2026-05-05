/**
 * Auth middleware — Supabase JWT verification.
 *
 * Replaces the previous manual jsonwebtoken.verify() approach.
 * supabase.auth.getUser(token) validates the token against Supabase Auth
 * and returns the authenticated user's data, including their UUID.
 */
const supabase = require('../lib/supabase');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach the Supabase auth user to the request.
  // user.id is the UUID that matches public.users.id
  req.user = { id: user.id, email: user.email };
  next();
}

module.exports = authMiddleware;
