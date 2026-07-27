"use client";

import { useEffect, useState } from "react";
import {
  REDUCED_MOTION_STORAGE_KEY,
  resolveInitialReducedMotionPref,
  shouldReduceMotion,
  type ReducedMotionPref,
} from "@/lib/reducedMotion";

const OPTIONS: { value: ReducedMotionPref; label: string }[] = [
  { value: "system", label: "System" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

export default function ReducedMotionSetting() {
  const [pref, setPref] = useState<ReducedMotionPref>("system");

  useEffect(() => {
    // Hydrates from localStorage (an external system, not props/state) —
    // same false-positive PageOutline.tsx already documented for this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(resolveInitialReducedMotionPref(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)));
  }, []);

  function handleSelect(value: ReducedMotionPref) {
    setPref(value);
    localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, value);
    // Applied immediately, directly on <html> — just a class; CSS
    // (DrawerNav's `motion-safe-transition` marker) and a fresh read at
    // click time (PageOutline.handleSelect) both reflect the change right
    // away, with no event bus between components needed.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.toggle(
      "reduce-motion",
      shouldReduceMotion(value, prefersReducedMotion)
    );
  }

  return (
    <div role="group" aria-label="Reduced motion" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const isActive = option.value === pref;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(option.value)}
            className={
              isActive
                ? "rounded-full border border-accent bg-accent px-4 py-1 text-xs font-semibold text-background"
                : "rounded-full border border-foreground/20 px-4 py-1 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
