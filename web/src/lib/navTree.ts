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
