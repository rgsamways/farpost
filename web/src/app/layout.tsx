import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AuthBootstrap from "@/components/AuthBootstrap";
import DrawerNav from "@/components/DrawerNav";
import Header from "@/components/Header";
import { MobileNavProvider } from "@/components/MobileNavContext";
import RightRail from "@/components/RightRail";
import SettingsBootstrap from "@/components/SettingsBootstrap";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: { default: "Farpost", template: "%s — Farpost" },
  description: "Building intelligence for rural Canada.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {/* Full-width sticky brand header band — repurposes the ported
            scaffold's decorative scroll-mask (design.md Decision 1): the
            same three mirrored-width columns as the nav/content/rail below,
            so the wordmark and icon cluster can't drift out of alignment
            with them independently. It's `fixed`, not CSS `position:
            sticky` — design.md Decision 5 describes the effect ("stays
            pinned while scrolling"), and Decision 1 is explicit that this
            reuses the ported `fixed` mask mechanism rather than a new one.
            Real, opaque navy content renders at every breakpoint now
            (mobile-app-shell) — Header.tsx owns its own mobile-scoped and
            xl-scoped render paths, both painted above (z-20) the nav/rail's
            sticky columns beneath it — see their matching `xl:pt-*` offsets
            below. Height is `h-auto` at all breakpoints
            (header-spacing-and-icon-alignment's `xl:` precedent, extended
            to mobile by mobile-app-shell), since the header's own content
            (wordmark+tagline+icons, with their own vertical padding) now
            determines the real height — every offset calibrated against
            "the header's height" elsewhere in this file, DrawerNav.tsx,
            RightRail.tsx, PageHeader.tsx, and PageOutline.tsx's scroll
            calibration must match whatever that renders to, not a
            hardcoded guess. */}
        <SettingsBootstrap />
        <AuthBootstrap />
        <MobileNavProvider>
          <header className="fixed inset-x-0 top-0 z-20 flex h-auto items-center border-b-2 border-orange bg-navy">
            <div className="pointer-events-none mx-auto flex h-full w-full max-w-6xl">
              <Header />
            </div>
          </header>
          <div className="mx-auto flex max-w-6xl">
            <DrawerNav />
            {/* pt-[73.75px] (not a round pt-16) matches the mobile header's
                real measured height (mobile-app-shell, measured against a
                running dev server) — it happens to equal the xl: header's
                own real measured height since both render the same
                wordmark+tagline content at the same 15px vertical padding,
                not because the two are wired together. */}
            <div className="min-w-0 flex-1 px-6 pb-10 pt-[73.75px] xl:px-10 xl:pt-[73.75px]">
              {/* PageOutline scans `main h2[id]` — the ported handoff's
                  layout.tsx snippet never actually included a `<main>`
                  element, which would have made that scan a silent no-op. */}
              <main className="w-full xl:max-w-3xl">{children}</main>
            </div>
            <RightRail />
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
