"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

// Wires mobile-app-shell's data-signed-in CSS toggle (built inert, since no
// auth existed yet) to real session state. Reactive, not a one-time check —
// authClient.useSession() re-renders this on sign-in/sign-out, keeping the
// attribute live for the header's signed-out-only/signed-in-only rules.
export default function AuthBootstrap() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session) {
      document.documentElement.dataset.signedIn = "true";
    } else {
      delete document.documentElement.dataset.signedIn;
    }
  }, [session]);

  return null;
}
