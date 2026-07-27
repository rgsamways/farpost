"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileNavContextValue = { open: boolean; setOpen: (open: boolean) => void };

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// Genuine two-way UI state (the hamburger trigger lives in RightRail's icon
// cluster, the panel it opens is owned by DrawerNav) — a small context rather
// than a DOM-attribute toggle, since the panel's own content (Escape listener,
// focus handling) needs the boolean as real component state, not just a style
// switch.
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav(): MobileNavContextValue {
  const context = useContext(MobileNavContext);
  if (!context) throw new Error("useMobileNav must be used within a MobileNavProvider");
  return context;
}
