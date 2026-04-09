# Support Team Monitoring

Next.js app for:

- Google OAuth login
- Gmail read access with encrypted token storage
- Admin-only monitoring dashboard
- User accounts with restricted visibility
- Background Gmail sync into PostgreSQL

## Stack

- Next.js
- Prisma
- Supabase Postgres

## Supabase setup

1. Create a Supabase project.
2. Open the project's `Connect` page.
3. Copy two Postgres URLs:
   - pooled connection for app runtime
   - direct connection for Prisma CLI
4. Put them in [`.env`](./.env):

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

5. Add your Google OAuth values.
6. Set the Google redirect URI:

```text
http://localhost:3000/api/auth/google/callback
```

7. Push the Prisma schema:

```bash
npm run db:push
```

8. Start the app:

```bash
npm run dev
```

## GitHub push

If this folder is not already a Git repository:

```bash
git init
git branch -M main
git remote add origin https://github.com/bunnybindemail-ctrl/gmail-monitoring.git
git add .
git commit -m "Prepare gmail monitoring app"
git push -u origin main
```

Important:

- [`.env`](./.env) is ignored by Git and should not be committed.
- Use [`.env.example`](./.env.example) as the safe template for teammates or deployment platforms.

## Render deployment

This repo now includes [render.yaml](./render.yaml) for a Render Blueprint with:

- one Next.js web service
- one cron service that runs `npm run sync:emails`
- health checks on `/api/health`
- `prisma db push` as the pre-deploy schema sync step

### Render env vars to fill in

Set these in Render before the deploy goes live:

- `DATABASE_URL`
- `DIRECT_URL`
- `APP_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `ADMIN_EMAILS`

Render can generate:

- `SESSION_SECRET`
- `CRON_SECRET`

### Google OAuth production redirect URI

After Render gives you the live domain, add this exact redirect URI in Google Cloud:

```text
https://your-render-domain.onrender.com/api/auth/google/callback
```

Also set:

```text
APP_URL=https://your-render-domain.onrender.com
```

## Notes

- `DATABASE_URL` is used by the app at runtime.
- `DIRECT_URL` is used by Prisma for schema operations.
- Background sync can be run manually with:

```bash
npm run sync:emails
```

## Main routes

- `/` login + consent screen
- `/app` user screen
- `/admin` admin dashboard
- `/api/admin/inbox` admin inbox API
- `/api/internal/sync` protected sync endpoint

## Official references

- Supabase Prisma troubleshooting:
  https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
- Prisma Supabase guide:
  https://www.prisma.io/docs/v6/orm/overview/databases/supabase
