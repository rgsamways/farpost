## Why

`wire-better-auth` makes real magic-link authentication exist on the backend, but nothing on the frontend uses it yet — `/sign-in` and `/account` are both still 404s that the header's icons have pointed at since the very first scaffold change. This change builds both pages for real, wired to the real auth client, not a UI stub — by the time this builds, real auth already exists to wire it to.

## What Changes

- A real `/sign-in` page: single email field, styled in Farpost's brand, calling `authClient.signIn.magicLink()`. No separate signup page — magic-link sign-in creates an account automatically, same as robinsamways.ca's own pattern, matching the already-decided "no signup gating" call.
- A real `/account` page: shows the signed-in user's email and a sign-out button that calls `authClient.signOut()`, per Robin's explicit request.
- **No `/sign-in/verify` page** — better-auth's magic-link plugin verifies the link and establishes the session entirely on the backend, redirecting straight to `callbackURL`. robinsamways.ca needed its own verify page only because its magic-link system is hand-rolled against a custom backend; that doesn't apply here, confirmed by reading its real code rather than assumed.
- **A real gap found while scoping this, fixed here**: the desktop header (`xl:` breakpoint) never got the dual-link signed-in/signed-out toggle `mobile-app-shell` built for mobile — it still has a single static sign-in link from the very first scaffold change. Desktop gets the same treatment now, so signing in is meaningful on both breakpoints, not just mobile.

## Capabilities

### New Capabilities
- `sign-in-and-account-pages`: real sign-in and account pages, wired to `wire-better-auth`'s client.

### Modified Capabilities
- `desktop-app-shell`: the header's sign-in icon becomes a session-conditional dual-link pair (signed-in/signed-out), matching the pattern `mobile-app-shell` already established for mobile — closing a real parity gap rather than leaving desktop permanently on the old static link.

## Impact

- New: `web/src/app/sign-in/page.tsx`, `web/src/app/account/page.tsx`, and their supporting form/panel components.
- `web/src/components/Header.tsx`: the `xl:` icon cluster's sign-in link becomes a dual-link toggle pair, mirroring the mobile implementation.
- Depends on `wire-better-auth` being built first (`authClient`, the session-to-attribute bootstrap, and real backend auth all need to exist).
