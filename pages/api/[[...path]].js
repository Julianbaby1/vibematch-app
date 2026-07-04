/**
 * Serves the entire Express API as a single Vercel serverless function.
 *
 * An Express app is a Node (req, res) handler, and Next.js pages/api
 * routes receive exactly that pair, so the app can be exported directly.
 * Requests keep their original URL (/api/auth/login etc.), which matches
 * the Express route mounts.
 *
 * Requires these env vars on Vercel:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS (optional)
 */
import { app } from '../../server/app';

export const config = {
  api: {
    // Express handles its own body parsing (express.json / multer)
    bodyParser: false,
    // Express manages the response lifecycle, not Next
    externalResolver: true,
  },
};

export default app;
