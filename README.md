# Portfolio Website

This is the codebase for my portfolio site built with Next.js.

## Guestbook moderation

Set the following environment variables on your deployment platform:

- `GUESTBOOK_ADMIN_TOKEN` – secret token you use to authorize deletions.
- `KV_REDIS_URL` – optional Redis connection string provided by the Vercel KV integration. When present, doodles are persisted in the managed Redis instance so they survive redeploys on the Vercel free tier.
- `GUESTBOOK_DATA_FILE` – optional path to the JSON file where doodles are stored when Redis isn’t configured. This keeps the guestbook data out of the Git repository. Use an absolute path or a path relative to the project root (e.g. `../data/guestbook.json`).
