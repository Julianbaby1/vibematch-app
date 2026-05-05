const supabase = require('../lib/supabase');

async function adminMiddleware(req, res, next) {
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (error || !data?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = adminMiddleware;
