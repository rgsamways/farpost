"use client";

import { useEffect, useRef, useState } from "react";

interface SegmentedDateInputProps {
  id?: string;
  label: string;
  value: string | null;
  onChange: (isoDate: string) => void;
}

// Positional MM/DD/YYYY boxes, not a single typed free-text field — ported
// from Vocare's SegmentedDateInput (web/src/components/SegmentedDateInput.tsx
// there), ADR'd for the same reason it applies here: sidesteps MM/DD vs
// DD/MM locale ambiguity on dates a stranger (an inspector, an adjuster)
// might read off this passport later.
function isRealDate(month: string, day: string, year: string) {
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const segmentClass =
  "w-11 rounded-md border border-foreground/20 bg-background py-2 text-center text-sm tracking-wide focus:border-accent focus:outline-none";

export default function SegmentedDateInput({ id, label, value, onChange }: SegmentedDateInputProps) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Sync from a parent-supplied value (e.g. the asset row loaded from the
  // API) without fighting the user's own typing — only runs when the prop
  // itself changes.
  useEffect(() => {
    if (!value) {
      setMonth("");
      setDay("");
      setYear("");
      return;
    }
    const [y, m, d] = value.split("-");
    if (y?.length === 4 && m?.length === 2 && d?.length === 2) {
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  function commit(m: string, d: string, y: string) {
    if (m.length === 2 && d.length === 2 && y.length === 4 && isRealDate(m, d, y)) {
      onChange(`${y}-${m}-${d}`);
    } else if (m === "" && d === "" && y === "") {
      // Explicit full clear only — a partially-typed date (e.g. mid-edit on
      // the year) must not PATCH the stored value to null before it's valid.
      onChange("");
    }
  }

  function digitsOnly(raw: string, maxLength: number) {
    return raw.replace(/\D/g, "").slice(0, maxLength);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-xs text-muted">
        {label}
      </label>
      <div id={id} className="mt-1 flex items-center gap-1.5">
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          placeholder="MM"
          aria-label={`${label} — month`}
          maxLength={2}
          value={month}
          onChange={(event) => {
            const v = digitsOnly(event.target.value, 2);
            setMonth(v);
            commit(v, day, year);
            if (v.length === 2) dayRef.current?.focus();
          }}
          className={segmentClass}
        />
        <span className="text-muted">/</span>
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          placeholder="DD"
          aria-label={`${label} — day`}
          maxLength={2}
          value={day}
          onChange={(event) => {
            const v = digitsOnly(event.target.value, 2);
            setDay(v);
            commit(month, v, year);
            if (v.length === 2) yearRef.current?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && day === "") monthRef.current?.focus();
          }}
          className={segmentClass}
        />
        <span className="text-muted">/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          aria-label={`${label} — year`}
          maxLength={4}
          value={year}
          onChange={(event) => {
            const v = digitsOnly(event.target.value, 4);
            setYear(v);
            commit(month, day, v);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && year === "") dayRef.current?.focus();
          }}
          className={`${segmentClass} w-14`}
        />
      </div>
    </div>
  );
}
