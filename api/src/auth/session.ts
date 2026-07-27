import type { FastifyRequest } from "fastify";
import { auth } from "./auth.js";

// Ported from Vocare's real, working pattern
// (c:\dev\vocare\backend\src\auth\session.ts) — only the auth.js import
// path changed. Every protected route calls this explicitly and returns a
// manual 401 on failure; no Fastify preHandler/decorator, matching
// Vocare's actual convention.
function toWebHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (!value) continue;
    headers.append(key, Array.isArray(value) ? value.join(", ") : value);
  }
  return headers;
}

export async function getSessionUser(request: FastifyRequest) {
  const result = await auth.api.getSession({ headers: toWebHeaders(request) });
  return result?.user ?? null;
}
