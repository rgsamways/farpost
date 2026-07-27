export type FontScale = "small" | "default" | "large" | "xlarge";

export const FONT_SCALE_STORAGE_KEY = "font-scale";

const FONT_SCALE_VALUES: Record<FontScale, string> = {
  small: "0.875",
  default: "1",
  large: "1.125",
  xlarge: "1.25",
};

export function resolveInitialFontScale(stored: string | null): FontScale {
  if (stored === "small" || stored === "default" || stored === "large" || stored === "xlarge") {
    return stored;
  }
  return "default";
}

// The literal multiplier written into `--font-scale` — a plain lookup, not
// derived at call sites, so every consumer (the settings control, the
// bootstrap) applies the identical value for a given scale.
export function fontScaleValue(scale: FontScale): string {
  return FONT_SCALE_VALUES[scale];
}
