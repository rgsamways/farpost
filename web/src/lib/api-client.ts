// The first non-auth API caller in this codebase — everything so far has
// only called the auth API directly via `authClient`. Kept minimal, not a
// generic SDK layer, per design.md Decision 5.
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}
