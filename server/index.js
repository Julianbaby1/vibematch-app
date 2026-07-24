/**
 * VibeMatch — standalone Express API server (local dev / Railway).
 *
 * On Vercel the same app is served as a serverless function via
 * pages/api/[[...path]].js — this file is not used there.
 */
// In production (Railway/Render) env vars are injected natively — no .env file.
// For local development, load from the project root .env if it exists.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { app, allowedOrigins } = require('./app');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VibeMatch API running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Supabase URL configured: ${!!process.env.SUPABASE_URL}`);
  if (!process.env.SUPABASE_URL) console.error('WARNING: SUPABASE_URL is not set!');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!');
});
