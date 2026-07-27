"use client";

import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMobileNav } from "./MobileNavContext";
import { isExpanded, type NavGroup, type NavLink } from "@/lib/navTree";

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Platform",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      {
        href: "/jobs",
        label: "Jobs",
        children: [
          { href: "/jobs/open", label: "Open" },
          { href: "/jobs/in-progress", label: "In Progress" },
          { href: "/jobs/completed", label: "Completed" },
        ],
      },
      { href: "/buildings", label: "Buildings" },
    ],
  },
  {
    heading: "Network",
    links: [
      { href: "/professionals", label: "Professionals" },
      { href: "/requests", label: "Requests" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/billing", label: "Billing" },
      { href: "/team", label: "Team" },
    ],
  },
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
          className="block flex-1 rounded px-2 py-1.5 text-sm hover:bg-foreground/5 hover:text-accent"
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
      {/* Full-viewport takeover on mobile, persistent sidebar at xl:+ — no
          backdrop, since nothing else is visible behind an opaque
          full-viewport panel. `xl:pt-[88.75px]` (not `py-6`'s usual top
          value) clears the real brand header now painted over this same
          sticky column at xl: — the old ported mask's flanking columns were
          invisible, so this offset was never needed until the header became
          real, opaque content. header-spacing-and-icon-alignment adds an
          explicit 15px margin on top of that clearance, per spec, so this
          is the header's real measured height (73.75px) + 15px, not just
          the header height — measured against a running dev server, not
          hand-calculated, since the header's real height includes its own
          2px bottom border on top of its content-driven padding.
          `motion-safe-transition` (settings-page) is the marker globals.css
          keys off of to kill this slide under `.reduce-motion` on <html>. */}
      <nav
        aria-label="Site"
        className={`motion-safe-transition fixed inset-0 z-50 overflow-y-auto border-r border-foreground/20 bg-background px-5 pb-6 pt-6 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } xl:sticky xl:top-0 xl:z-auto xl:h-screen xl:w-64 xl:translate-x-0 xl:shrink-0 xl:pt-[88.75px]`}
      >
        {/* The sidebar's own "Farpost" link is gone (spec: "Left nav omits a
            redundant brand label") — at xl: the new header already carries
            the brand, so the group heading below is the first visible
            element. The close button (mobile-only) stays. */}
        <div className="mb-6 flex items-center justify-end xl:hidden">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-foreground/20">
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
