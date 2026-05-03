require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/matches');
const chatRoutes = require('./routes/chat');
const circleRoutes = require('./routes/circles');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');

const app = express();
const httpServer = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'second-wind-dev-secret';

// ─────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────
//  REST API Routes
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'Second Wind API' }));

// ─────────────────────────────────────────
//  Socket.io  — real-time chat
// ─────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Authenticate socket connections via JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`User connected: ${userId}`);

  // Join personal room for DMs
  socket.join(`user:${userId}`);

  // Join a match conversation room
  socket.on('join_match', async ({ matchId }) => {
    try {
      const { rows } = await db.query(
        'SELECT id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, userId]
      );
      if (rows[0]) socket.join(`match:${matchId}`);
    } catch (err) {
      console.error('join_match error:', err);
    }
  });

  // Send a message
  socket.on('send_message', async ({ matchId, content, messageType = 'text', mediaUrl }) => {
    try {
      const { rows: matchRows } = await db.query(
        'SELECT user1_id, user2_id FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
        [matchId, userId]
      );
      if (!matchRows[0]) return;

      const { rows } = await db.query(
        `INSERT INTO messages (match_id, sender_id, content, message_type, media_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [matchId, userId, content, messageType, mediaUrl || null]
      );

      await db.query('UPDATE matches SET last_message_at = NOW() WHERE id = $1', [matchId]);

      // Reset ghosting clock for sender
      await db.query(
        `UPDATE response_tracking SET last_responded_at = NOW(), ghost_warning_sent = false, penalty_applied = false
         WHERE match_id = $1 AND user_id = $2`,
        [matchId, userId]
      );

      const { rows: senderRows } = await db.query(
        'SELECT first_name, profile_photo_url FROM users WHERE id = $1',
        [userId]
      );

      const message = {
        ...rows[0],
        first_name: senderRows[0].first_name,
        profile_photo_url: senderRows[0].profile_photo_url,
      };

      // Broadcast to everyone in the match room
      io.to(`match:${matchId}`).emit('new_message', message);

      // Push notification to the other user if they aren't in the room
      const otherUserId = matchRows[0].user1_id === userId
        ? matchRows[0].user2_id
        : matchRows[0].user1_id;
      io.to(`user:${otherUserId}`).emit('message_notification', {
        matchId,
        senderName: senderRows[0].first_name,
        preview: content?.slice(0, 60),
      });
    } catch (err) {
      console.error('send_message error:', err);
    }
  });

  // Typing indicator
  socket.on('typing', ({ matchId, isTyping }) => {
    socket.to(`match:${matchId}`).emit('user_typing', { userId, isTyping });
  });

  // Join a circle room for group chat
  socket.on('join_circle', async ({ circleId }) => {
    const { rows } = await db.query(
      'SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2',
      [circleId, userId]
    );
    if (rows[0]) socket.join(`circle:${circleId}`);
  });

  socket.on('circle_message', async ({ circleId, content }) => {
    try {
      const { rows: memberRows } = await db.query(
        'SELECT 1 FROM circle_members WHERE circle_id = $1 AND user_id = $2',
        [circleId, userId]
      );
      if (!memberRows[0]) return;

      const { rows } = await db.query(
        `INSERT INTO circle_messages (circle_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
        [circleId, userId, content.trim()]
      );

      const { rows: senderRows } = await db.query(
        'SELECT first_name, profile_photo_url FROM users WHERE id = $1',
        [userId]
      );

      io.to(`circle:${circleId}`).emit('new_circle_message', {
        ...rows[0],
        first_name: senderRows[0].first_name,
        profile_photo_url: senderRows[0].profile_photo_url,
      });
    } catch (err) {
      console.error('circle_message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// ─────────────────────────────────────────
//  Start
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Second Wind API running on http://localhost:${PORT}`);
});
