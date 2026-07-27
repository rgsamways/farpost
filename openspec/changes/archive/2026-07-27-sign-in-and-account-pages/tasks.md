## 1. Sign-in page

- [x] 1.1 Build `SignInForm.tsx` (Farpost-styled): email field, idle/submitting/sent/error states, calls `authClient.signIn.magicLink({ email, callbackURL: "/account" })`
- [x] 1.2 Build `web/src/app/sign-in/page.tsx`: renders `SignInForm`, redirects to `/account` via `useSession()` if already signed in
- [x] 1.3 Copy: brief explanatory text that signing in creates an account automatically (no separate signup needed), matching the tone already established on the dashboard/settings pages

## 2. Account page

- [x] 2.1 Build `web/src/app/account/page.tsx`: shows the signed-in user's email, a sign-out control calling `authClient.signOut()`, redirects to `/sign-in` via `useSession()` if no session exists

## 3. Desktop header parity fix

- [x] 3.1 Update `Header.tsx`'s `xl:` icon cluster: replace the single static sign-in link with the same dual-link `data-signed-in`-toggled pair (`LogIn` → `/sign-in`, `User` → `/account`) mobile already has
- [x] 3.2 Update `Header.test.tsx` to assert both variants exist and toggle correctly at the `xl` breakpoint, matching the existing mobile test coverage from `mobile-app-shell`

## 4. Tests and verification

- [x] 4.1 Test: sign-in page redirects an already-signed-in session to `/account`
- [x] 4.2 Test: account page redirects a signed-out visitor to `/sign-in`
- [x] 4.3 Test: account page displays the real signed-in email and sign-out ends the session
- [x] 4.4 `npm run build`, `npm run lint`, `npm test` pass in `web/`
- [x] 4.5 Manual, real end-to-end verification: request a real magic link, click it, confirm the session cookie survives the redirect from the API's port back to the web app, confirm both the mobile and desktop header icons correctly show the profile state afterward, then sign out and confirm both revert to signed-out
- [x] 4.6 Report plainly whether task 4.5's real email step was actually completed — it needs the `RESEND_API_KEY` flagged back in `wire-better-auth`'s proposal; say so if it wasn't available yet rather than skip the step silently
