import Fastify from "fastify";
import cors from "@fastify/cors";
import { sql } from "drizzle-orm";
import { authPlugin } from "./auth/fastify-plugin.js";
import { db } from "./db/client.js";
import { buildingsRoutes } from "./routes/buildings.js";
import { assetsRoutes } from "./routes/assets.js";

export function buildApp() {
  // trustProxy: Railway (and Cloudflare in front of it) terminate TLS at
  // their own edge — this is exactly what broke Twilio signature validation
  // for the old Farpost backend (requests arrived as http:// internally even
  // though the real request was https://). Nothing here depends on
  // X-Forwarded-* yet, but there's no reason to leave this misconfigured
  // until it bites again.
  const fastify = Fastify({ logger: true, trustProxy: true });

  fastify.register(cors, {
    origin: process.env.WEB_URL ?? false,
    credentials: true,
    // @fastify/cors defaults to 'GET,HEAD,POST' — found live, not assumed,
    // while browser-testing this change's own PATCH endpoint: a real
    // preflight rejection ("Method PATCH is not allowed by
    // Access-Control-Allow-Methods"), not a CORS config anyone had reason
    // to touch before this was the first PATCH route in the codebase.
    methods: ["GET", "POST", "PATCH"],
  });

  fastify.register(authPlugin);
  fastify.register(buildingsRoutes);
  fastify.register(assetsRoutes);

  fastify.get("/health", async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return { status: "ok", db: "connected" };
    } catch (err) {
      fastify.log.error(err);
      reply.code(503);
      return { status: "error", db: "disconnected" };
    }
  });

  return fastify;
}
