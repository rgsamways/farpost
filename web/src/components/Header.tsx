"use client";

import { LogIn, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useMobileNav } from "./MobileNavContext";

// Renders inside the column-mirroring wrapper in layout.tsx (design.md
// Decision 1): the wordmark/tagline sit in the same width column as
// DrawerNav below it, the icon cluster in the same width column as
// RightRail — so they can't drift out of alignment independently. Below
// `xl` this component instead renders its own single-row mobile header
// (mobile-app-shell) — DrawerNav/RightRail no longer carry their own
// floating mobile bars.
export default function Header() {
  const { setOpen } = useMobileNav();

  return (
    <>
      {/* Mobile-scoped header row (mobile-app-shell). Icon button styling
          matches the xl: icon cluster below for visual consistency, though
          the two never render at the same time. */}
      <div data-testid="mobile-header" className="flex w-full items-center justify-between px-5 py-[15px] xl:hidden">
        <Link href="/" className="pointer-events-auto flex flex-col justify-center">
          <span className="text-lg font-bold tracking-wide text-offwhite">FARPOST</span>
          <span className="text-[11px] leading-tight text-orange">
            Building intelligence for rural Canada
          </span>
        </Link>
        <div data-testid="mobile-icon-cluster" className="flex items-center gap-[15px]">
          {/* Both links always render; globals.css's [data-signed-in] rules
              toggle which one is visible — see design.md Decision 3. */}
          <Link href="/sign-in" aria-label="Sign in"
            className="signed-out-only pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
            <LogIn className="h-4 w-4" />
          </Link>
          <Link href="/account" aria-label="Your account"
            className="signed-in-only pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
            <User className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/settings" aria-label="Site settings"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* xl:py-[15px] (header-spacing-and-icon-alignment) is what actually
          determines the header's real rendered height now — see the note
          on <header> in layout.tsx. */}
      <div className="hidden xl:flex xl:w-64 xl:shrink-0 xl:flex-col xl:justify-center xl:py-[15px] xl:pl-5">
        <Link href="/" className="pointer-events-auto text-lg font-bold tracking-wide text-offwhite">
          FARPOST
        </Link>
        <p className="text-[11px] leading-tight text-orange">
          Building intelligence for rural Canada
        </p>
      </div>
      <div className="hidden flex-1 xl:block" />
      {/* xl:justify-start + xl:pl-5 (not xl:justify-end + xl:pr-5) — the
          icon cluster's left edge now matches the right rail's left edge
          (where PageOutline's own xl:px-5 content starts), reversing the
          prior right-edge alignment per this change's MODIFIED spec
          requirement. xl:gap-[15px] and xl:py-[15px] are new spacing.
          xl:self-start (not the row's default stretch) keeps this column at
          its own natural height (padding + icon size) instead of being
          stretched to match the taller wordmark/tagline column — without
          it, the shared row's centering would give this block ~20px of
          top/bottom space instead of the 15px actually asked for. */}
      <div className="hidden xl:flex xl:w-64 xl:shrink-0 xl:items-center xl:justify-start xl:gap-[15px] xl:self-start xl:py-[15px] xl:pl-5">
        <Link href="/settings" aria-label="Site settings"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
          <Settings className="h-4 w-4" />
        </Link>
        {/* Same signed-out-only/signed-in-only CSS toggle (globals.css)
            mobile-app-shell built for mobile — sign-in-and-account-pages
            closes the parity gap desktop had carried since the first
            scaffold change (a single static sign-in link). */}
        <Link href="/sign-in" aria-label="Sign in"
          className="signed-out-only pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
          <LogIn className="h-4 w-4" />
        </Link>
        <Link href="/account" aria-label="Your account"
          className="signed-in-only pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-offwhite/30 text-offwhite hover:bg-offwhite/10">
          <User className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
