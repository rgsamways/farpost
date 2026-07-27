"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth-client";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
  }

  if (!session) return null;

  return (
    <>
      <PageHeader kicker="Farpost" title="Account" />
      <p className="mb-1 text-sm text-muted">Email</p>
      <p className="mb-6 text-sm font-semibold">{session.user.email}</p>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
      >
        Sign out
      </button>
    </>
  );
}
