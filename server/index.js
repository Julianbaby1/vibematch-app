/**
 * Second Wind — Express API Server
 *
 * Real-time chat is now handled entirely by Supabase Realtime
 * (postgres_changes subscriptions on the frontend).
 * Socket.io has been removed — the server is a clean REST API.
 */
// In production (Railway/Render) env vars are injected natively — no .env file.
// For local development, load from the project root .env if it exists.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const matchRoutes  = require('./routes/matches');
const chatRoutes   = require('./routes/chat');
const circleRoutes = require('./routes/circles');
const eventRoutes  = require('./routes/events');
const adminRoutes  = require('./routes/admin');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
// FRONTEND_URL can be a comma-separated list for multi-origin support,
// e.g. "https://justmytype.help,https://www.justmytype.help"
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS blocked origin: ${origin} — allowed: ${allowedOrigins.join(', ')}`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/events',  eventRoutes);
app.use('/api/admin',   adminRoutes);

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', service: 'Second Wind API', realtime: 'supabase' })
);

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Second Wind API running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Supabase URL configured: ${!!process.env.SUPABASE_URL}`);
  if (!process.env.SUPABASE_URL) console.error('WARNING: SUPABASE_URL is not set!');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error('WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!');
});
