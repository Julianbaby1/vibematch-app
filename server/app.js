/**
 * Second Wind — Express application (no listener).
 *
 * Exported separately so it can run two ways:
 *   1. Standalone server:  `node server/index.js` (local dev / Railway)
 *   2. Vercel serverless:  mounted by pages/api/[[...path]].js in the
 *      Next.js app, so frontend and API share one deployment and origin.
 */
const express = require('express');
const cors    = require('cors');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const matchRoutes  = require('./routes/matches');
const chatRoutes   = require('./routes/chat');
const circleRoutes = require('./routes/circles');
const eventRoutes  = require('./routes/events');
const adminRoutes  = require('./routes/admin');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────
// FRONTEND_URL can be a comma-separated list for multi-origin support.
// On Vercel the API is same-origin with the frontend, so the deployment's
// own URLs (injected by Vercel) are allowed automatically.
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
];

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

module.exports = { app, allowedOrigins };
