"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SignInForm from "@/components/SignInForm";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/account");
    }
  }, [isPending, session, router]);

  return (
    <>
      <PageHeader kicker="Farpost" title="Sign In" />
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Passwordless — enter your email and we&rsquo;ll send you a link. New here? Signing in
        creates your account automatically, no separate signup needed.
      </p>
      <SignInForm />
    </>
  );
}
