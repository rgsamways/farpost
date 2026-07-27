"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type Status = "idle" | "submitting" | "sent" | "error";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    // Must be absolute (window.location.origin — the web app's own origin,
    // matching Vocare's real reference usage), not a bare relative path.
    // better-auth's verify redirect resolves a relative callbackURL against
    // its own BETTER_AUTH_URL (the API's origin, e.g. localhost:3001), which
    // 404s there since the API has no /account route — confirmed directly
    // via a real end-to-end click-through, not assumed from config.
    const { error } = await authClient.signIn.magicLink({
      email: trimmed,
      callbackURL: `${window.location.origin}/account`,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="max-w-md text-sm text-muted">
        Check your email for a sign-in link. It expires in 5 minutes and can only be used once.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-4">
      <div>
        <label htmlFor="signin-email" className="block text-sm font-semibold">
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted">
          No password — we&rsquo;ll email you a link instead. New here? Signing in creates your
          account automatically.
        </p>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-background disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send sign-in link"}
      </button>

      {status === "error" && (
        <p className="text-xs text-muted">Enter a valid email address and try again.</p>
      )}
    </form>
  );
}
