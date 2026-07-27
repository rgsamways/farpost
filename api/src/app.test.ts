import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("GET /health", () => {
  // Requires the local Docker Postgres running (`docker compose up -d` in
  // `api/`) — see api/README.md. This is a deliberate trade-off
  // (design.md Decision 4): the whole point of this check is proving the
  // real DB connection works, not just that the process is up.
  it("returns ok status with db connected when Postgres is reachable", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", db: "connected" });
  });
});

describe("CORS", () => {
  it("allows the configured WEB_URL origin", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: process.env.WEB_URL! },
    });

    expect(response.headers["access-control-allow-origin"]).toBe(process.env.WEB_URL);
  });

  it("does not permit an unconfigured origin", async () => {
    // @fastify/cors with a static string `origin` always echoes the
    // *configured* origin, never the request's — a browser comparing that
    // value against its own (unconfigured) origin rejects the response, so
    // "not permitted" means the header doesn't equal the requesting origin,
    // not that the header is absent. Same mechanism Vocare's real backend
    // already relies on.
    const app = buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    });

    expect(response.headers["access-control-allow-origin"]).not.toBe("http://evil.example.com");
  });
});
