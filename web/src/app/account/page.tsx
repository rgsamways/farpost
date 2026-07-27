"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
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

      <SectionHeader title="Account" />
      <p className="mb-1 text-sm text-muted">Email</p>
      <p className="mb-6 text-sm font-semibold">{session.user.email}</p>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent"
      >
        Sign out
      </button>
      <p className="text-sm leading-relaxed text-muted">
        Display name, professional titles and accreditations, usage history, and role selection
        are coming here — including a high-level summary of the sections below once they&apos;re
        built.
      </p>

      <SectionHeader title="Buildings" />
      <p className="text-sm leading-relaxed text-muted">
        Buildings you&apos;ve taken ownership of will list here, along with each building&apos;s
        associated property, assets, and observation history.
      </p>

      <SectionHeader title="Features" />
      <p className="text-sm leading-relaxed text-muted">
        Features available to you — both free and paid, depending on your roles — will list here
        with usage stats and what&apos;s coming next for each.
      </p>

      <SectionHeader title="Connections" />
      <p className="text-sm leading-relaxed text-muted">
        Your connections to other users, groups, buildings, and messaging will show here.
      </p>

      <SectionHeader title="Work" />
      <p className="text-sm leading-relaxed text-muted">
        Current jobs you&apos;re involved in and your work history will show here.
      </p>
    </>
  );
}
