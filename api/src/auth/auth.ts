import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "../db/client.js";
import { sendMagicLink } from "./send-magic-link.js";

// Ported from Vocare's real, working config (docs handoff:
// vocare-better-auth-reference.md) minus everything Vocare-specific: no
// `additionalFields`, no `databaseHooks` — those existed solely to enforce
// Vocare's age/country gate before account creation, which Farpost doesn't
// have. Farpost's own identity data lives on `membership-schema.ts` instead.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.WEB_URL ? [process.env.WEB_URL] : undefined,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: false },
  socialProviders: {},
  session: {
    // 30-day sliding window, refreshed on activity.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // Only set in production (COOKIE_DOMAIN=.farpost.ca on Railway) — left
  // unset locally so dev's working localhost:3000/3001 flow doesn't break.
  // Without this, the session cookie set by api.farpost.ca would never be
  // sent to farpost.ca: better-auth scopes cookies to the exact host by
  // default, and localhost's lack of port-scoping was masking that this was
  // never actually verified across two real, separate domains.
  advanced: process.env.COOKIE_DOMAIN
    ? { crossSubDomainCookies: { enabled: true, domain: process.env.COOKIE_DOMAIN } }
    : undefined,
  plugins: [
    magicLink({
      expiresIn: 60 * 5,
      disableSignUp: false,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink(email, url);
      },
    }),
  ],
});
