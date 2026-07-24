# LEGACY PROTOTYPE — do not deploy

This folder is an early Vite prototype (formerly "JustMyType"). The real
VibeMatch product is the Next.js app at the repository root.

Known problems with this prototype:
- It targets a Supabase project (`zsbchkyvzhxtthyrbavv`) that is not the
  production VibeMatch project.
- Its optional `VITE_OPENAI_API_KEY` pattern would expose an OpenAI key in the
  browser bundle. Never set that variable.
- The GitHub Action `.github/workflows/deploy-justmytype-hostinger.yml` deploys
  THIS folder to Hostinger over FTP. It should be updated to deploy the root
  Next.js app (or removed) once the owner decides how justmytype.help is hosted.

Kept temporarily for reference only. Scheduled for removal in a later phase.
