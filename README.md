# Portfolio Website

This is the codebase for my portfolio site built with Next.js.

## Guestbook moderation

Set the following environment variables on your deployment platform:

- `GUESTBOOK_ADMIN_TOKEN` – secret token you use to authorize deletions.
- `KV_REDIS_URL` – optional Redis connection string provided by the Vercel KV integration. When present, doodles are persisted in the managed Redis instance so they survive redeploys on the Vercel free tier.
- `GUESTBOOK_DATA_FILE` – optional path to the JSON file where doodles are stored when Redis isn’t configured. This keeps the guestbook data out of the Git repository. Use an absolute path or a path relative to the project root (e.g. `../data/guestbook.json`).

### Choosing a storage option

1. **Vercel Redis integration (recommended for production)** – Install the [Vercel KV integration](https://vercel.com/integrations/kv) on your project. The integration automatically injects a `KV_REDIS_URL` environment variable that contains the Redis connection string. With that variable in place, the app reads and writes doodles using the managed Redis instance, so entries persist across redeploys.
2. **Filesystem (local development or self-hosting)** – If Redis isn’t configured, the app writes doodles to `GUESTBOOK_DATA_FILE`, falling back to `data/guestbook.json`. This is ideal for local testing but won’t persist across Vercel redeploys.

With the variables in place you can create an admin session by posting the admin token to `/api/guestbook/admin/session`. The server stores an HttpOnly cookie so you can access `/guestbook/admin` without exposing the token in your codebase.
