# Second Wind

> A thoughtful dating and social networking platform for adults 39 and older.  
> Built with Next.js · Express · PostgreSQL · Socket.io

---

## What is Second Wind?

Second Wind prioritizes meaningful conversations over swipe-based behavior. Users answer three personal prompts before matching, get five curated daily profiles, and build accountability through a transparent response-rate system.

**Key features:**
- Age-verified registration (39+)
- Conversation-first matching via prompt responses
- Daily limit of 5 profile suggestions (no swipe mechanic)
- Real-time chat with Socket.io + voice note support hooks
- Accountability system: ghosting reduces visibility score
- Interest Circles (group communities)
- Local events with RSVP
- Login streaks & badges
- Admin panel (user management, reports, stats)

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router), React 18 |
| Backend    | Node.js + Express                 |
| Database   | PostgreSQL                        |
| Auth       | JWT (Bearer tokens)               |
| Real-time  | Socket.io                         |
| Styling    | Pure CSS (no UI framework)        |

---

## Project Structure

```
second-wind/
├── app/                    # Next.js App Router pages
│   ├── page.js             # Landing page
│   ├── login/page.js       # Sign in
│   ├── register/page.js    # Multi-step registration (3 steps)
│   ├── dashboard/page.js   # Daily profiles + stats
│   ├── matches/page.js     # Confirmed connections
│   ├── chat/page.js        # Real-time messaging
│   ├── profile/page.js     # Edit profile
│   ├── circles/page.js     # Interest communities
│   ├── events/page.js      # Local events
│   ├── admin/page.js       # Admin panel
│   ├── globals.css         # Design system (CSS variables, components)
│   └── layout.js           # Root layout
│
├── components/             # Shared React components
│   ├── Navbar.jsx
│   ├── MatchCard.jsx       # Daily profile card with prompt previews
│   ├── Badge.jsx           # Achievement badges
│   ├── CircleCard.jsx      # Interest group card
│   └── EventCard.jsx       # Event with RSVP actions
│
├── lib/                    # Frontend utilities
│   ├── api.js              # Typed fetch wrapper + token helpers
│   └── socket.js           # Socket.io client singleton
│
├── server/                 # Express + Socket.io API
│   ├── index.js            # Server entry point
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   └── admin.js        # Admin role check
│   ├── routes/
│   │   ├── auth.js         # Register, login, /me
│   │   ├── users.js        # Profile CRUD, file uploads
│   │   ├── matches.js      # Daily queue, connect/pass, match list
│   │   ├── chat.js         # Message history, ghosting job
│   │   ├── circles.js      # Communities CRUD
│   │   ├── events.js       # Events + RSVP
│   │   └── admin.js        # Stats, ban/unban, reports
│   └── db/
│       ├── index.js        # pg Pool wrapper
│       └── schema.sql      # Full PostgreSQL schema + seed data
│
├── uploads/                # User-uploaded media (gitignored)
├── package.json            # Frontend deps
├── server/package.json     # Backend deps
├── next.config.js          # Rewrites /api → Express
└── .env.example
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone and install

```bash
git clone <repo-url>
cd second-wind

# Install frontend deps
npm install

# Install backend deps
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/second_wind
JWT_SECRET=your-super-secret-key
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Set up the database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE second_wind;"

# Run schema (creates all tables + seeds prompts and circles)
psql -U postgres -d second_wind -f server/db/schema.sql
```

### 4. Run the servers

In two separate terminals:

**Terminal 1 — Express API + Socket.io (port 3001)**
```bash
cd server
npm run dev         # requires nodemon  →  npm install -g nodemon
# or: node index.js
```

**Terminal 2 — Next.js frontend (port 3000)**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

### Auth
| Method | Path                | Auth | Description          |
|--------|---------------------|------|----------------------|
| POST   | /api/auth/register  | ✗    | Register (39+)       |
| POST   | /api/auth/login     | ✗    | Login → JWT token    |
| GET    | /api/auth/me        | ✓    | Current user profile |

### Users
| Method | Path                       | Auth | Description          |
|--------|----------------------------|------|----------------------|
| GET    | /api/users/:id             | ✓    | Public profile       |
| PUT    | /api/users/profile         | ✓    | Update own profile   |
| POST   | /api/users/upload/photo    | ✓    | Upload photo         |
| POST   | /api/users/upload/voice    | ✓    | Upload voice intro   |
| GET    | /api/users/prompts/list    | ✓    | Get all prompts      |
| POST   | /api/users/report/:id      | ✓    | Report a user        |

### Matches
| Method | Path                 | Auth | Description                    |
|--------|----------------------|------|--------------------------------|
| GET    | /api/matches/daily   | ✓    | Today's 5 curated profiles     |
| POST   | /api/matches/action  | ✓    | Connect or Pass on a profile   |
| GET    | /api/matches         | ✓    | All confirmed connections       |

### Chat
| Method | Path                             | Auth   | Description           |
|--------|----------------------------------|--------|-----------------------|
| GET    | /api/chat/:matchId               | ✓      | Message history       |
| POST   | /api/chat/:matchId               | ✓      | Send message (REST)   |
| POST   | /api/chat/jobs/check-ghosting    | secret | Run ghosting checker  |

### Circles
| Method | Path                          | Auth | Description         |
|--------|-------------------------------|------|---------------------|
| GET    | /api/circles                  | ✓    | List all circles    |
| POST   | /api/circles                  | ✓    | Create a circle     |
| POST   | /api/circles/:id/join         | ✓    | Join a circle       |
| POST   | /api/circles/:id/leave        | ✓    | Leave a circle      |
| GET    | /api/circles/:id/messages     | ✓    | Circle messages     |
| POST   | /api/circles/:id/messages     | ✓    | Post to circle      |

### Events
| Method | Path                       | Auth | Description         |
|--------|----------------------------|------|---------------------|
| GET    | /api/events                | ✓    | Browse events       |
| POST   | /api/events                | ✓    | Create event        |
| POST   | /api/events/:id/rsvp       | ✓    | RSVP to event       |
| GET    | /api/events/:id/attendees  | ✓    | List attendees      |

### Admin  _(requires is_admin = true)_
| Method | Path                    | Auth    | Description        |
|--------|-------------------------|---------|--------------------|
| GET    | /api/admin/stats        | admin   | Platform stats     |
| GET    | /api/admin/users        | admin   | User list          |
| POST   | /api/admin/ban/:userId  | admin   | Ban user           |
| POST   | /api/admin/unban/:userId| admin   | Unban user         |
| GET    | /api/admin/reports      | admin   | All reports        |
| PATCH  | /api/admin/reports/:id  | admin   | Update report      |

---

## Socket.io Events

### Client → Server
| Event           | Payload                                     | Description              |
|-----------------|---------------------------------------------|--------------------------|
| `join_match`    | `{ matchId }`                               | Join a DM room           |
| `send_message`  | `{ matchId, content, messageType }`         | Send a message           |
| `typing`        | `{ matchId, isTyping }`                     | Typing indicator         |
| `join_circle`   | `{ circleId }`                              | Join a circle room       |
| `circle_message`| `{ circleId, content }`                     | Post to circle           |

### Server → Client
| Event                 | Description                          |
|-----------------------|--------------------------------------|
| `new_message`         | New DM received                      |
| `user_typing`         | Other user is typing                 |
| `message_notification`| Notification for offline user        |
| `new_circle_message`  | New message in a circle              |

---

## Accountability System

The system tracks response behavior per match:

1. When a user sends a message, their `last_responded_at` timestamp resets.
2. A scheduled job (`POST /api/chat/jobs/check-ghosting`) checks for users with `last_responded_at` older than **72 hours**.
3. Ghosting users receive a **−5 visibility score** penalty (floor: 0).
4. Users with a **response rate > 90%** receive a **+2 visibility boost** each run.
5. High-visibility users appear more often in daily match queues.

Run the ghosting checker with a cron job or cloud scheduler:
```bash
# Daily cron — add to server's crontab
0 8 * * * curl -X POST http://localhost:3001/api/chat/jobs/check-ghosting \
  -H "x-job-secret: YOUR_JOB_SECRET"
```

---

## Making an Admin

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

---

## Design System

The CSS is entirely in `app/globals.css` using CSS custom properties. Key tokens:

| Token           | Value       | Use                    |
|-----------------|-------------|------------------------|
| `--primary`     | `#2E4B3C`   | Forest green — CTAs    |
| `--accent`      | `#C9935A`   | Warm gold — highlights |
| `--bg`          | `#F7F4EF`   | Warm parchment         |
| `--surface`     | `#FFFFFF`   | Cards                  |
| `--text`        | `#1A1A1A`   | Body text              |
| `--text-muted`  | `#6B6B6B`   | Secondary text         |

Base font size is **17px** (bumped from 16 for readability for 39+ users).

---

## Badges

| Badge                  | How to earn                          |
|------------------------|--------------------------------------|
| `streak_7`             | 7 consecutive daily logins           |
| `streak_30`            | 30 consecutive daily logins          |
| `event_organizer`      | Create your first event              |
| `consistent_communicator` | Manually awarded via admin / future automation |
| `community_pillar`     | Future: active circle participation  |
