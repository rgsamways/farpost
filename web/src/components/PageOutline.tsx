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

  // Verbatim from docs/handoff-2026-07-26-farpost-framing-scaffold.md — the
  // DOM scan needs a client-only effect (no `document` during SSR), which
  // Next.js 16's default lint config (react-hooks/set-state-in-effect,
  // newer than this ported code) flags on principle even though there's no
  // actual cascading-render issue here: it's a document rather than props/
  // state, this component's only consumer.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // Top offset matches the combined brand header (content-driven
      // height as of header-spacing-and-icon-alignment, measured at
      // 73.75px) + the center column's own sticky per-page header (~105px)
      // — see globals.css's `main h2[id]` scroll-margin-top for the same
      // figure.
    }, { rootMargin: "-179px 0px -60% 0px" });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < MIN_SECTIONS_TO_SHOW) return null;

  function handleSelect(id: string) {
    setActiveId(id);
    // Read fresh at click time (settings-page D2), not cached in state —
    // `scrollIntoView`'s explicit `behavior` overrides CSS `scroll-behavior`
    // entirely, so this can't be handled by a CSS rule the way DrawerNav's
    // slide transition is.
    const reduceMotion = document.documentElement.classList.contains("reduce-motion");
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
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
