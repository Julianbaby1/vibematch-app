# VibeMatch App

VibeMatch is a simple Next.js dating-app demo with profile cards, Like/Pass buttons, a match counter, and a matches panel.

## What you need first

Install these on your computer:

- Node.js 18 or newer
- npm
- Git

## Get the app running locally

Open Terminal, PowerShell, or VS Code Terminal and run:

```bash
git clone https://github.com/Julianbaby1/vibematch-app.git
cd vibematch-app
npm install
npm run dev
```

Then open this in your browser:

```text
http://localhost:3000
```

## Common commands

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Builds the app for production.

```bash
npm run start
```

Runs the production build after `npm run build`.

## Current app status

This version is mostly front-end only. The app shows sample dating profiles and stores likes/passes in temporary browser memory. When you refresh the page, the likes and passes reset.

## Next good upgrades

- Connect Supabase for real user accounts
- Add signup and login
- Save profiles, likes, passes, and matches to the database
- Add real messaging
- Add profile photos uploaded by users
- Add location or preference filters

## Troubleshooting

If `npm install` fails, make sure Node.js is installed correctly:

```bash
node -v
npm -v
```

If the app says the port is already in use, try:

```bash
npm run dev -- -p 3001
```

Then open:

```text
http://localhost:3001
```
