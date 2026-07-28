---
name: run
description: Launch Farpost's two dev servers (Fastify api + Next.js web) and drive a real signed-in browser session against them to verify a feature end to end. Project-specific override of the generic "run" skill — built 2026-07-27 after the systems-passport feature's first browser verification had to improvise this from scratch.
license: MIT
metadata:
  author: farpost
  version: "1.0"
---

Built after `systems-passport` (Farpost's first real feature) needed real browser verification
and had no established pattern to follow — the fallback approach worked, but cost real time
working out things that are now just documented facts below. Use this instead of rediscovering
them.

## Prerequisites

Dev Postgres must be running: `docker ps` should show `api-postgres-1` (postgis/postgis image,
port 5435). If it's not running, `cd api && docker compose up -d` starts it.

`@playwright/test` is a **permanent** devDependency in `web/package.json` (added 2026-07-27) —
do not install/uninstall it per session. Chromium is cached globally at
`~/AppData/Local/ms-playwright/` (Windows) — `npx playwright install chromium` is a no-op if
already present, safe to run once if starting fresh, not something to repeat every time.

## 1. Start both dev servers

Two separate Node processes, two separate directories — there is no monorepo/workspace tooling,
`api/` and `web/` are independent npm projects.

```
cd api && npm run dev   # tsx watch src/index.ts, listens on :3001 (api/.env's PORT)
cd web && npm run dev   # next dev, listens on :3000
```

Run both in the background (e.g. the Bash tool's `run_in_background`) — they need to stay up for
the whole verification session. `web/.env.local`'s `NEXT_PUBLIC_API_URL=http://localhost:3001`
is already wired to point the frontend at the local API; no config needed.

Confirm both are actually ready before driving a browser against them — don't just assume the
process started successfully:

```
curl -s http://localhost:3001/health   # {"status":"ok","db":"connected"}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000   # 200 (or a redirect code)
```

## 2. Real sign-in technique for an automated browser session

Farpost has no password auth — only magic-link email. There is no real inbox to check in an
automated run. The proven technique (already used by every real-DB API test, e.g.
`api/src/routes/buildings.test.ts`'s `signIn()` helper) is to pull the token directly out of the
dev database instead of an email:

1. In the real browser, navigate to `http://localhost:3000/sign-in`, fill in the email field,
   submit. This is a real form submission — it hits the real
   `POST /api/auth/sign-in/magic-link` endpoint and writes a real row to `verification`.
2. Query the dev database directly for that row (there's no need to go through the browser for
   this step — a plain `pg` script against `postgresql://farpost:farpost@localhost:5435/farpost`
   is simplest):
   ```sql
   SELECT identifier FROM verification
   WHERE value LIKE '%"email":"<the email you used>"%'
   ORDER BY created_at DESC LIMIT 1;
   ```
   `identifier` is the real magic-link token.
3. Navigate the browser directly to the verify URL — **`callbackURL` must be the web app's full
   absolute origin, not a relative path.** Verified this the hard way while writing this skill:
   `callbackURL=/account` resolves against better-auth's own base URL
   (`http://localhost:3001`, the API), landing the browser on the API server with a raw JSON
   404, not the actual account page. `web/src/components/SignInForm.tsx` gets this right for a
   reason — it always builds `` `${window.location.origin}/account` ``, an absolute URL against
   the *web* origin:
   ```
   http://localhost:3001/api/auth/magic-link/verify?token=<identifier>&callbackURL=http%3A%2F%2Flocalhost%3A3000%2Faccount
   ```
   (URL-encode the callback value.) This redirects the browser to `localhost:3000/account` with
   a real session cookie set — cookies are host-scoped not port-scoped, so the same
   `better-auth.session_token` cookie is sent on subsequent requests to any `localhost:*` port,
   including API calls from the web app.
4. From this point the browser has a real, valid session — navigate anywhere in the app that
   requires auth (e.g. `/features/systems-passport`) and it behaves exactly as a real signed-in
   user would.

This is the same technique the real test suite uses (`app.inject` instead of a real HTTP call to
step 1, but everything else identical) — proven, not improvised per session.

## 3. What a real browser catches that `app.inject`/vitest never will

Found for real on `systems-passport`, worth remembering as a category, not just that one bug:
CORS preflight rejections. `@fastify/cors` defaults to `methods: 'GET,HEAD,POST'` — any route
using `PATCH`/`PUT`/`DELETE` needs an explicit `methods` array in `app.ts`'s cors registration,
or a real browser's preflight `OPTIONS` request will reject it while every `app.inject`-based
test stays green (inject bypasses the browser's CORS enforcement entirely). Check `app.ts`'s
cors `methods` list includes whatever HTTP methods the feature being tested actually uses.

## 4. Cleanup

Stop both dev server background processes when done. No database cleanup needed beyond whatever
the feature's own tests already handle — a manually-seeded test building/stake (per
`systems-passport`'s design.md, since no real claim flow exists yet) should be deleted after a
manual verification session if it's not meant to persist:

```sql
DELETE FROM stake WHERE user_id = '<test-user-id>';
DELETE FROM building WHERE id = '<test-building-id>';
```

## When this skill doesn't apply

If a future feature needs something this doesn't cover (a second browser tab for a
multi-account scenario, file upload, WebSocket behavior, mobile viewport), extend this file
rather than re-improvising a fallback pattern from scratch — that's the whole point of it
existing.
