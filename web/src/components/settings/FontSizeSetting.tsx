"use client";

import { useEffect, useState } from "react";
import {
  FONT_SCALE_STORAGE_KEY,
  fontScaleValue,
  resolveInitialFontScale,
  type FontScale,
} from "@/lib/fontScale";

const OPTIONS: { value: FontScale; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "xlarge", label: "Extra Large" },
];

export default function FontSizeSetting() {
  const [scale, setScale] = useState<FontScale>("default");

  useEffect(() => {
    // Hydrates from localStorage (an external system, not props/state) —
    // same false-positive PageOutline.tsx already documented for this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScale(resolveInitialFontScale(localStorage.getItem(FONT_SCALE_STORAGE_KEY)));
  }, []);

  function handleSelect(value: FontScale) {
    setScale(value);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, value);
    document.documentElement.style.setProperty("--font-scale", fontScaleValue(value));
  }

  return (
    <div role="group" aria-label="Font size" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const isActive = option.value === scale;
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
