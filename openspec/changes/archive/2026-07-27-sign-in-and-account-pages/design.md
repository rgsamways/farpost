## Context

Reference for the UI shape: robinsamways.ca's real `sign-in/page.tsx` and `SignInForm.tsx` (single email field, idle/submitting/sent/error states, plain copy about passwordless sign-in). Reference for what *not* to port: `VerifySignIn.tsx` and the `/sign-in/verify` route — read directly, and confirmed they exist only because robinsamways.ca's magic-link system is hand-rolled against its own custom backend (`POST /accounts/verify`, a token stored in `localStorage`). better-auth's magic-link plugin doesn't work that way: it verifies the link and establishes the session cookie entirely server-side, then redirects the browser straight to `callbackURL`. Porting a verify page here would be building UI for a flow that doesn't exist in better-auth.

## Goals / Non-Goals

**Goals:**
- A real, working sign-in page wired to `wire-better-auth`'s real `authClient`.
- A real account page with a working sign-out.
- Parity: both breakpoints' headers reflect real signed-in state, not just mobile.

**Non-Goals:**
- No separate sign-up page or flow — magic-link sign-in already creates accounts automatically.
- No profile editing, no `Membership`/role display — `Membership` isn't populated by anything yet (per `wire-better-auth`'s own non-goals). The account page shows only what's real today: email and sign-out.
- No route-protection middleware — `/account` checks session client-side and redirects if none exists; a server-side auth-gating layer is a separate, later concern if Farpost ever needs pages that must never render their content to a logged-out request at all.

## Decisions

### 1. Sign-in and account stay two separate pages, not merged like robinsamways.ca's

robinsamways.ca's `SignInForm.tsx` conditionally renders either the sign-in form or an "already signed in" panel on the same page. Robin asked for a distinct account page here, so instead: `/sign-in` redirects to `/account` if a session already exists (via `useSession()`), and `/account` redirects to `/sign-in` if none does — two pages, each responsible for its own case, rather than one page branching on state.

### 2. `authClient.signIn.magicLink({ email, callbackURL: \`${window.location.origin}/account\` })`

After a real magic-link click, better-auth's own backend verifies the token, sets the session cookie, and redirects the browser directly to `/account` — no frontend verify step.

**Corrected post-implementation, via real end-to-end testing (task 4.5):** the reference-doc's shape (`callbackURL: "/account"`, a bare relative path) is wrong for this split-origin setup. better-auth resolves a relative `callbackURL` against its own `BETTER_AUTH_URL` (the API's origin, `localhost:3001`) — not the browser's current origin — so the verify redirect landed on the API server itself, which has no `/account` route, reproducing the exact 404 Robin saw during `wire-better-auth`'s own manual check. The fix, confirmed working end-to-end (real send, real click-through, request payload captured to verify): build an absolute URL from `window.location.origin` at submit time, matching Vocare's real usage (`` callbackURL: `${window.location.origin}/account` ``) — the one thing the `wire-better-auth` handoff doc had already flagged as *not* verified end-to-end (Risk: "the actual cookie surviving the redirect ... is worth confirming directly, not assumed from config alone"). The session cookie itself turned out fine either way — `localhost` cookies aren't port-scoped, so the cookie set on `:3001` was already valid for `:3000` — the actual bug was purely the redirect *destination*, not the cookie.

### 3. Desktop header parity fix, scoped here rather than retroactively into an already-archived change

`mobile-app-shell` built the dual-link `data-signed-in` toggle for mobile only (its own spec was scoped to "mobile renders..."). `wire-better-auth`'s bootstrap component sets the attribute globally, but without matching dual-link markup on desktop, that attribute has no visible effect there — a real, if narrow, gap. Fixing it here rather than reopening `mobile-app-shell`: this is the first change where being signed in actually means something (a real `/account` to link to), so it's the natural point to close the gap, not a regression introduced by this change.

## Risks / Trade-offs

- **[Risk]** Cross-origin session cookie behavior (Fastify on `:3001`, Next.js on `:3000`, both `localhost`) hasn't been verified end-to-end yet — `trustedOrigins` is configured in `wire-better-auth`, but the actual cookie surviving the redirect from the API's port back to the web app's port is worth confirming directly, not assumed from config alone. → **Mitigation:** an explicit manual-verification task, not just a code review.
- **[Risk]** No server-side route protection means `/account`'s real content technically reaches a logged-out browser before the client-side redirect fires (a brief flash, not a security hole — no sensitive data is in the initial render since there's nothing server-rendered from session state yet). → Not solving here; worth a real look if `/account` ever renders something sensitive server-side.
