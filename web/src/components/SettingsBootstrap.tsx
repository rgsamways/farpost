"use client";

import { useEffect } from "react";
import { FONT_SCALE_STORAGE_KEY, fontScaleValue, resolveInitialFontScale } from "@/lib/fontScale";
import {
  REDUCED_MOTION_STORAGE_KEY,
  resolveInitialReducedMotionPref,
  shouldReduceMotion,
} from "@/lib/reducedMotion";

// The one place both persisted settings get applied on mount, on every page
// — mounted once in the root layout, rather than living inside a nav
// component, so a setting made on /settings is still in effect on
// /dashboard after a fresh page load. No theme here (design.md non-goal —
// Farpost has no dark palette) and no session bit (that's wire-better-auth,
// later); font-scale and reduced-motion have no blocking-script equivalent
// to avoid a flash on first paint, an accepted trade-off for now.
export default function SettingsBootstrap() {
  useEffect(() => {
    const fontScale = resolveInitialFontScale(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
    document.documentElement.style.setProperty("--font-scale", fontScaleValue(fontScale));

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reducedMotionPref = resolveInitialReducedMotionPref(
      localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      shouldReduceMotion(reducedMotionPref, prefersReducedMotion)
    );
  }, []);

  return null;
}
