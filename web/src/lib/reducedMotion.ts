export type ReducedMotionPref = "system" | "on" | "off";

export const REDUCED_MOTION_STORAGE_KEY = "reduced-motion";

// Resolves only the *stored* preference — two independent inputs (an
// explicit override vs. the OS query) stay as separate functions rather than
// folded into one, since "what's stored" and "what's actually applied" can
// each be needed on their own (the settings control shows the stored
// preference; the bootstrap/PageOutline need the resolved effect).
export function resolveInitialReducedMotionPref(stored: string | null): ReducedMotionPref {
  if (stored === "on" || stored === "off") return stored;
  return "system";
}

// "System" (the default) defers entirely to the OS query; an explicit
// override in either direction takes precedence over it.
export function shouldReduceMotion(pref: ReducedMotionPref, osPrefersReduced: boolean): boolean {
  if (pref === "on") return true;
  if (pref === "off") return false;
  return osPrefersReduced;
}
