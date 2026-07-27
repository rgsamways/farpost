## Context

Grounded in two real sources, not guessed: `c:\dev\robinsamways\docs\handoff-2026-07-26-vocare-better-auth-reference.md` (Vocare's real, live better-auth config, read directly from `c:\dev\vocare\backend`), and `c:\dev\robinsamways\docs\handoff-2026-07-26-farpost-vocare-suite-context.md` (the resolution of whether Farpost needs age-gating — it doesn't, not yet). `docs/core-user-model.md` already resolved where Farpost's own identity data goes (`Membership`, not `user.additionalFields`).

## Goals / Non-Goals

**Goals:**
- Real, working magic-link auth on the Fastify backend, matching Vocare's proven Fastify-integration gotchas exactly rather than rediscovering them.
- `Membership` exists as a real table, matching `core-user-model.md`'s Layer 2 design, ready for later changes to actually populate.
- The mobile header's `data-signed-in` toggle (already built, currently inert) gets wired to real session state.

**Non-Goals:**
- No age gate, no `pendingSignups`, no required-fields-before-signup pattern at all — confirmed not a Farpost requirement today. If the Vocare-derived practice engine eventually needs this, the gate belongs at *engine enrollment*, not account creation (per the suite-context handoff) — not built here, not designed further here.
- No sign-in page, no account page, no UI at all — that's `sign-in-and-account-pages`, next. This change is server config plus the client SDK wiring, nothing user-facing yet.
- No professional-role UI populating `Membership` — the table exists, nothing writes to it yet.

## Decisions

### 1. Server config: Vocare's reference, minus everything Vocare-specific

```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.WEB_URL ? [process.env.WEB_URL] : undefined,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: false },
  socialProviders: {},
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  plugins: [magicLink({ expiresIn: 60 * 5, disableSignUp: false, sendMagicLink: async ({ email, url }) => { await sendMagicLink(email, url); } })],
});
```

No `user.additionalFields`, no `databaseHooks` at all — both were solely how Vocare enforced its age/country gate. Farpost has nothing to enforce at signup, so both are simply absent, not stubbed out.

**Alternative considered:** copy `additionalFields`/`databaseHooks` verbatim now, populate them later if Farpost ever needs them. Rejected — building unused gating machinery "just in case" is exactly the kind of premature scope this project's own methodology argues against, and the suite-context handoff explicitly says not to design around this yet.

### 2. `Membership` table, per `core-user-model.md`'s already-resolved shape

```typescript
export const membership = pgTable("membership", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  status: text("status", { enum: ["pending", "active", "suspended", "revoked"] }).notNull().default("active"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});
```

`role` stays plain, unconstrained `text` — no enum, per `core-user-model.md`'s resolved fork (Farpost's own role-curation admin screen, when built, is what validates it, not the shared schema). Nothing in this change writes a `Membership` row for anyone; it exists so the shape is real and correct, not populated.

### 3. Fastify catch-all, ported with both real gotchas intact

```typescript
fastify.all("/api/auth/*", async (request, reply) => {
  setCorsHeaders(reply); // manual — reply.hijack() bypasses Fastify's normal header pipeline
  if (request.method === "OPTIONS") { reply.code(204).send(); return; }
  reply.hijack();
  await toNodeHandler(auth)(request.raw, reply.raw);
});
```

Fastify's own JSON body parser gets neutralized specifically for this route (a no-op content-type parser scoped to the auth plugin, not global) since better-auth's Node handler parses the request body itself — the same isolation principle as scoping a webhook's raw-body handling away from every other route's normal parsing.

### 4. Client-side session bridge: a new small component, not a Vocare port

Vocare has no equivalent of Farpost's `data-signed-in` CSS-toggle pattern (its own frontend is a different app shell). This change adds a small client component — mounted once in `layout.tsx`, same pattern as `SettingsBootstrap` — that calls `authClient.useSession()` and sets/removes `document.documentElement.dataset.signedIn` reactively as session state changes, satisfying the contract `mobile-app-shell`'s header already assumed.

### 5. Real email sending is Robin's own dependency to provision, not something built around a guess

Vocare uses Resend. This change writes `send-magic-link.ts` against the Resend SDK, matching that precedent, but a real `RESEND_API_KEY` and a verified sending domain (e.g. a `farpost.ca` subdomain) have to come from Robin directly — not something to fabricate a placeholder for. Tests mock `sendMagicLink` entirely (matching Vocare's own real test pattern: `vi.mock("./send-magic-link.js", ...)`), so this doesn't block writing or testing the auth flow itself, only real end-to-end email delivery.

## Risks / Trade-offs

- **[Risk]** Auth tests need a live Postgres instance and hit real database rows (matching Vocare's own real test pattern — no mocked DB), same trade-off already accepted in `scaffold-fastify-backend`. → Not a new risk, just inherited consistently.
- **[Risk]** Without a real `RESEND_API_KEY`, the magic-link flow can be built and unit-tested but not verified end-to-end (an actual email landing in an actual inbox). → **Mitigation:** call this out plainly in the final report rather than claim full verification that didn't happen.
