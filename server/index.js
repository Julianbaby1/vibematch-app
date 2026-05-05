/**
 * Second Wind — Express API Server
 *
 * Real-time chat is now handled entirely by Supabase Realtime
 * (postgres_changes subscriptions on the frontend).
 * Socket.io has been removed — the server is a clean REST API.
 */
require('dotenv').config({ path: '../.env' });

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
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
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
  console.log(`Second Wind API running on http://localhost:${PORT}`);
});
