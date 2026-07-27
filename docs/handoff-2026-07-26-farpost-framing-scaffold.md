# Handoff: porting robinsamways.ca's page framing to the Farpost rebuild

**What this file is:** a self-contained handoff, written from inside the robinsamways.ca
repo, for a *future* Claude Code session working inside Farpost's own repo (`c:\dev\farpost`
or wherever the rebuild lives). It is not a robinsamways.ca change and has no bearing on
this site's own specs. It exists here only because this is where the source code being
copied from actually lives. Once picked up and used, this file can be deleted from this
repo — it was never meant to live here permanently.

**How to use this file:** read it whole before writing anything. It contains the actual,
current (as of 2026-07-26) source of every component needed to reproduce robinsamways.ca's
3-column page framing — left tiered nav, center column with a sticky header, right rail
with Settings/Sign-in icons plus an inline "on this page" anchor nav. Farpost's frontend is
already Next.js (confirmed — the rebuild only changes the backend: Mongo→Postgres,
FastAPI→Fastify, per the siloes/cross-project stack work), so this is a near-direct port,
not a framework rewrite. A visual mock of this framing (plain black/white, faked nav and
anchor content, since Farpost has none of that yet) exists at
`docs/farpost-framing-mockup.html` in the robinsamways.ca repo, for reference — open it
directly in a browser if you want to see the target shape before reading code.

## What's directly portable vs. what needs Farpost-specific work

**Portable close to as-is** (the actual layout/interaction mechanism):
- The 3-column composition itself (`layout.tsx`'s structure below)
- `MobileNavContext` (shared open/close state between the nav panel and its trigger)
- `DrawerNav`'s tiered/collapsible nav mechanism (`navTree.ts`'s `isExpanded`/`pathMatches`,
  the recursive `NavItem` component, the full-viewport mobile takeover)
- `RightRail`'s icon-cluster + widened desktop rail structure
- `PageOutline`'s DOM-scan-based anchor nav (scans real `<h2 id>` elements, no manual
  registry) and its active-section highlighting
- `SectionHeader` + `slugify.ts`'s stable, collision-safe anchor-id generation

**Needs Farpost-specific replacement, not a copy:**
- `NAV_GROUPS`' actual content (Site/Work/Experiments/Writing/Ops, the Dev-Log-specific
  `DEV_LOG_ENTRIES`/`capRecentEntries` logic) — all robinsamways.ca-specific. Replace with
  Farpost's own real nav structure once decided.
- `Header.tsx`'s actual fields (resume contact info) — replace with whatever Farpost's own
  sticky top-of-page content should be. The *mechanism* (sticky positioning, the
  `scroll-margin-top` pairing with `PageOutline`'s `IntersectionObserver` rootMargin) is
  what's reusable; the resume content isn't.
- The `data-signed-in` session-conditional icon (`AccountOrSignInLinks` in `RightRail.tsx`,
  the CSS rules in `globals.css`) is wired to this project's own passwordless
  magic-link `session.ts`. Farpost's rebuild uses better-auth — the *pattern* (a DOM
  attribute toggled by the auth library's own sign-in/sign-out calls, read live by CSS,
  because the rail mounts once and doesn't remount on navigation) still applies, but the
  attribute needs to be set from better-auth's session events, not this file's `session.ts`.
- Theme colors (`--background`/`--foreground`/`--accent`/`--skills-bg` in `globals.css`) —
  robinsamways.ca's are a specific dark/orange monospace identity. Farpost hasn't decided
  its own brand colors yet; the mock in `docs/farpost-framing-mockup.html` deliberately uses
  plain black-on-white instead of guessing at Farpost's palette.
- There is currently no real anchor-nav content to show — no Farpost page yet uses the
  `SectionHeader` pattern. This is fine and expected: `PageOutline` already handles "no
  content yet" gracefully (it renders nothing at all when a page has fewer than 2 sections,
  per its own `MIN_SECTIONS_TO_SHOW` check) — nothing needs to be faked in the real
  implementation, only in the visual mock shown for preview purposes.

## Real source, as of 2026-07-26

### `layout.tsx` — the 3-column composition

```tsx
import type { Metadata } from "next";
import DrawerNav from "@/components/DrawerNav";
import Header from "@/components/Header";
import { MobileNavProvider } from "@/components/MobileNavContext";
import RightRail from "@/components/RightRail";
import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {/* Mirrors the real nav/content/rail column widths so this mask covers
            exactly the content column's own top gap at every breakpoint — full
            width on mobile (nav/rail are position:fixed, out of flow there),
            narrowed to the middle column once xl: widths put the sidebars back
            in flow, so it never paints over either sidebar's own sticky-to-the-
            top content. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto flex max-w-6xl"
        >
          <div className="hidden xl:block xl:w-64 xl:shrink-0" />
          <div className="h-16 flex-1 bg-background xl:h-10" />
          <div className="hidden xl:block xl:w-64 xl:shrink-0" />
        </div>
        <MobileNavProvider>
          <div className="mx-auto flex max-w-6xl">
            <DrawerNav />
            <div className="min-w-0 flex-1 px-6 pb-10 pt-16 xl:px-10 xl:pt-10">
              <div className="w-full xl:max-w-3xl">
                <Header />
                {children}
              </div>
            </div>
            <RightRail />
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
```

(robinsamways.ca's real file also mounts a theme-init inline script and a settings
bootstrap component — omitted here since those are specific to this site's own
theme/font-size/reduced-motion settings feature, not part of the core framing.)

### `MobileNavContext.tsx` — shared open/close state, verbatim

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileNavContextValue = { open: boolean; setOpen: (open: boolean) => void };

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// Genuine two-way UI state (the hamburger trigger lives in RightRail's icon
// cluster, the panel it opens is owned by DrawerNav) — a small context rather
// than a DOM-attribute toggle, since the panel's own content (Escape listener,
// focus handling) needs the boolean as real component state, not just a style
// switch.
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav(): MobileNavContextValue {
  const context = useContext(MobileNavContext);
  if (!context) throw new Error("useMobileNav must be used within a MobileNavProvider");
  return context;
}
```

### `navTree.ts` — the tiered-nav expand/collapse logic, verbatim

```tsx
export type NavLink = { href: string; label: string; children?: NavLink[] };
export type NavGroup = { heading: string; links: NavLink[] };

// True if pathname is href itself or a route nested under it — used both to
// highlight the current page and to auto-expand every ancestor group above
// it, since a child's href is always nested under its parent's.
export function pathMatches(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// A group with children is expanded by default whenever the active route
// falls under it; a manual toggle (recorded in `overrides`) takes precedence
// over that default until the page reloads.
export function isExpanded(
  link: NavLink,
  pathname: string,
  overrides: Record<string, boolean>
): boolean {
  const override = overrides[link.href];
  if (override !== undefined) return override;
  return pathMatches(link.href, pathname);
}
```

### `DrawerNav.tsx` — tiered left nav + full-viewport mobile takeover

Strip `PROJECT_RECORD_CHILDREN`, `DEV_LOG_ENTRIES`, and `NAV_GROUPS`' actual content —
those are robinsamways.ca-specific. Keep everything else: the recursive `NavItem`
component, the `useMobileNav()` wiring, the full-viewport mobile panel.

```tsx
"use client";

import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMobileNav } from "./MobileNavContext";
import { isExpanded, type NavGroup, type NavLink } from "./navTree";

// Replace with Farpost's own real nav structure.
const NAV_GROUPS: NavGroup[] = [
  { heading: "Platform", links: [/* ... */] },
];

function NavItem({
  link, pathname, overrides, onToggle, onNavigate, depth,
}: {
  link: NavLink; pathname: string; overrides: Record<string, boolean>;
  onToggle: (href: string) => void; onNavigate: () => void; depth: number;
}) {
  const hasChildren = !!link.children?.length;
  const expanded = hasChildren && isExpanded(link, pathname, overrides);

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={link.href}
          onClick={onNavigate}
          aria-current={pathname === link.href ? "page" : undefined}
          className="block flex-1 rounded px-2 py-1.5 text-sm hover:bg-skills-bg hover:text-accent"
        >
          {link.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => onToggle(link.href)}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${link.label}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center text-muted hover:text-accent"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="ml-3 border-l border-foreground/10 pl-2">
          {link.children!.map((child) => (
            <NavItem key={child.href} link={child} pathname={pathname} overrides={overrides}
              onToggle={onToggle} onNavigate={onNavigate} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function DrawerNav() {
  const { open, setOpen } = useMobileNav();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  function toggleGroup(href: string) {
    setOverrides((current) => ({
      ...current,
      [href]: !isExpanded({ href, label: "" }, pathname, current),
    }));
  }

  return (
    <>
      {/* Brand pill, mobile top bar — mirrors the content column's own box
          (mx-auto max-w-6xl + matching px) so it tracks the content's left
          edge instead of the viewport's below the xl breakpoint. */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-30 xl:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="pointer-events-auto flex h-9 items-center rounded-md border border-foreground/20 bg-background px-3 text-sm font-bold">
            Farpost
          </Link>
        </div>
      </div>

      {/* Full-viewport takeover on mobile, persistent sidebar at xl:+ — no
          backdrop, since nothing else is visible behind an opaque
          full-viewport panel. */}
      <nav
        aria-label="Site"
        className={`fixed inset-0 z-50 overflow-y-auto border-r border-foreground/20 bg-background px-5 py-6 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } xl:sticky xl:top-0 xl:z-auto xl:h-screen xl:w-64 xl:translate-x-0 xl:shrink-0`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold" onClick={() => setOpen(false)}>Farpost</Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20 xl:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-5">
            <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{group.heading}</h2>
            <ul>
              {group.links.map((link) => (
                <NavItem key={link.href} link={link} pathname={pathname} overrides={overrides}
                  onToggle={toggleGroup} onNavigate={() => setOpen(false)} depth={0} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
```

### `RightRail.tsx` — icon cluster + hosting the outline

The `AccountOrSignInLinks` pattern (both links always in the DOM, CSS-only swap via a
`data-signed-in` attribute) needs Farpost's better-auth session events to set that
attribute — see "Needs Farpost-specific replacement" above. The structural shell below is
otherwise portable as-is.

```tsx
"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { useMobileNav } from "./MobileNavContext";
import PageOutline from "./PageOutline";

export default function RightRail() {
  const { setOpen } = useMobileNav();

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-30 xl:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-6">
          {/* AccountOrSignInLinks goes here — see note above on better-auth wiring */}
          <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20 bg-background">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/settings" aria-label="Site settings"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20 bg-background">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="hidden xl:sticky xl:top-0 xl:z-auto xl:flex xl:h-screen xl:w-64 xl:shrink-0 xl:flex-col xl:gap-6 xl:border-l xl:border-foreground/20 xl:bg-background xl:px-5 xl:py-6">
        <div className="flex items-center gap-2">
          <Link href="/settings" aria-label="Site settings"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20 hover:bg-skills-bg">
            <Settings className="h-5 w-5" />
          </Link>
          {/* AccountOrSignInLinks again here */}
        </div>
        <PageOutline />
      </div>
    </>
  );
}
```

### `PageOutline.tsx` — DOM-scan anchor nav (core mechanism, verbatim)

This is the part with no Farpost-specific content to strip — it works purely off real
`<h2 id>` elements under `main`, so it needs zero changes to function once Farpost has
pages using `SectionHeader`. Simplified here (full version in robinsamways.ca's
`web/src/components/PageOutline.tsx` also handles a click glow effect and reduced-motion —
optional polish, not required for the core mechanism):

```tsx
"use client";

import { List } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Section = { id: string; title: string };
const MIN_SECTIONS_TO_SHOW = 2;

function scanSections(): Section[] {
  return Array.from(document.querySelectorAll<HTMLHeadingElement>("main h2[id]")).map((heading) => ({
    id: heading.id,
    title: (heading.textContent ?? "").replace(/^##\s*/, "").trim(),
  }));
}

export default function PageOutline() {
  const pathname = usePathname();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => { setSections(scanSections()); }, [pathname]);

  useEffect(() => {
    if (sections.length < MIN_SECTIONS_TO_SHOW) return;
    const elements = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (elements.length === 0) return;
    const intersecting = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) intersecting.add(entry.target.id);
        else intersecting.delete(entry.target.id);
      }
      const firstVisible = sections.find((s) => intersecting.has(s.id));
      if (firstVisible) setActiveId(firstVisible.id);
    }, { rootMargin: "0px 0px -60% 0px" }); // recalibrate to match your own sticky header's height
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < MIN_SECTIONS_TO_SHOW) return null;

  function handleSelect(id: string) {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav aria-label="On this page" className="hidden xl:block">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
        <List className="h-3.5 w-3.5" /> On this page
      </p>
      <ul className="space-y-1 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <button type="button" onClick={() => handleSelect(section.id)}
              aria-current={section.id === activeId ? "true" : undefined}
              className={section.id === activeId
                ? "block w-full cursor-pointer border-l-2 border-accent px-2 py-1 text-left font-semibold text-accent"
                : "block w-full cursor-pointer border-l-2 border-foreground/20 px-2 py-1 text-left text-muted transition hover:border-accent/50 hover:text-accent"}>
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### `slugify.ts` + `SectionHeader.tsx` — stable anchor ids, verbatim

```ts
// slugify.ts
export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function resolveUniqueSlug(title: string, usedSlugs: Set<string>): string {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}
```

```tsx
// SectionHeader.tsx
import { cache } from "react";
import { resolveUniqueSlug } from "./slugify";

const getUsedSlugsForThisPage = cache(() => new Set<string>());

export default function SectionHeader({ title }: { title: string }) {
  const id = resolveUniqueSlug(title, getUsedSlugsForThisPage());
  return (
    <div className="section-heading-row mb-4 mt-10 flex items-center gap-3 rounded-md">
      <h2 id={id} className="whitespace-nowrap text-sm font-bold tracking-wide">{title}</h2>
      <hr className="flex-1 border-t border-accent" />
    </div>
  );
}
```

### `globals.css` — the CSS variables and sticky-header/scroll-margin pairing

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --muted: #525252;
  --accent: #d97706; /* pick Farpost's own */
  --skills-bg: #f5f5f4;
}

body {
  background: var(--background);
  color: var(--foreground);
}

/* If your center-column header is sticky, pair its rendered height with
   scroll-margin-top here — otherwise the header will cover whatever heading
   scrolls to the very top, for both PageOutline clicks and plain #anchor
   loads. Measure your own header's real height; don't guess. */
main h2[id] {
  scroll-margin-top: 8rem; /* placeholder — measure your own header */
}
```

## Sequencing note

There's nothing to fake in the real implementation — `PageOutline` already renders nothing
until a page has 2+ real `SectionHeader` sections, so this framing can ship before any
content exists that uses it. The mock in `docs/farpost-framing-mockup.html` fakes nav
labels and anchor entries purely so Robin could preview the shape before this handoff was
written — don't carry those fake values into the real implementation.
