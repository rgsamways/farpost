// The center column's own sticky per-page header — kicker + h1 + rule,
// matching docs/farpost-framing-mockup.html's `.sticky-header` pattern.
export default function PageHeader({ kicker, title }: { kicker: string; title: string }) {
  // `top-[73.75px] xl:top-[73.75px]` (not the mock's literal `top: 0`) so
  // this header parks just below the real, opaque brand header once stuck,
  // instead of sliding underneath it and getting its top clipped — see the
  // header z-index/offset note in layout.tsx. Both values match the
  // header's own real measured height at that breakpoint
  // (header-spacing-and-icon-alignment for xl:, mobile-app-shell for the
  // base value) — they happen to be numerically equal since mobile and xl
  // render the same wordmark+tagline content at the same 15px padding.
  return (
    <header className="sticky top-[73.75px] z-10 -mx-6 bg-background px-6 pb-4 pt-6 xl:top-[73.75px] xl:mx-0 xl:px-0">
      <p className="mb-1 text-xs text-muted">{kicker}</p>
      <h1 className="text-xl font-bold">{title}</h1>
      <hr className="mt-4 border-t border-foreground/20" />
    </header>
  );
}
