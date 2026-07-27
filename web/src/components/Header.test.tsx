import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DrawerNav from "./DrawerNav";
import Header from "./Header";
import { MobileNavProvider } from "./MobileNavContext";

// DrawerNav (rendered below, for the hamburger-opens-nav test) calls
// usePathname — mocked the same way DrawerNav.test.tsx does, since there's
// no real Next.js router mounted in this component test.
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

function renderHeader() {
  return render(
    <MobileNavProvider>
      <Header />
    </MobileNavProvider>
  );
}

describe("Header", () => {
  // Real pixel alignment (verified by hand against a running dev server: the
  // FARPOST wordmark and PageOutline both land at x=164/x=1276 at a 1440px
  // viewport) isn't measurable in jsdom, which doesn't run layout. This test
  // instead guards the structural invariant design.md Decision 1 depends on:
  // the header's xl-scoped flanking columns share the exact width class the
  // nav/rail columns use, so they can't silently drift apart. The mobile row
  // (mobile-app-shell) is a separate top-level element, excluded here via
  // its own data-testid.
  it("sizes its xl wordmark and icon-cluster columns to match the nav/rail column width (xl:w-64)", () => {
    const { container } = renderHeader();
    const columns = Array.from(container.querySelectorAll(":scope > div")).filter(
      (el) => el.getAttribute("data-testid") !== "mobile-header"
    );
    expect(columns).toHaveLength(3);
    expect(columns[0].className).toContain("xl:w-64");
    expect(columns[2].className).toContain("xl:w-64");
  });

  it("renders the FARPOST wordmark in the xl left column", () => {
    renderHeader();
    // Exact name "FARPOST" only matches the xl column's Link — the mobile
    // row's Link also wraps the tagline, giving it a longer accessible name.
    expect(screen.getByRole("link", { name: "FARPOST" })).toBeInTheDocument();
  });

  it("renders settings and sign-in icons in the xl right column", () => {
    renderHeader();
    expect(screen.getAllByRole("link", { name: "Site settings" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sign in" }).length).toBeGreaterThan(0);
  });

  // sign-in-and-account-pages: desktop parity fix — the xl icon column had
  // carried a single static sign-in link since the first scaffold change;
  // it now gets the same signed-out-only/signed-in-only CSS toggle
  // (globals.css) mobile-app-shell already built for mobile. Real computed
  // visibility isn't measurable in jsdom without a loaded stylesheet — see
  // the matching mobile test's comment — so this guards the structural
  // invariant instead.
  it("renders both sign-in and profile links in the xl icon column, tagged for the signed-in/signed-out CSS toggle", () => {
    const { container } = renderHeader();
    const columns = Array.from(container.querySelectorAll(":scope > div")).filter(
      (el) => el.getAttribute("data-testid") !== "mobile-header"
    );
    const iconColumn = columns[2];
    const signIn = within(iconColumn).getByRole("link", { name: "Sign in" });
    const profile = within(iconColumn).getByRole("link", { name: "Your account" });
    expect(signIn.className).toContain("signed-out-only");
    expect(signIn).toHaveAttribute("href", "/sign-in");
    expect(profile.className).toContain("signed-in-only");
    expect(profile).toHaveAttribute("href", "/account");
  });

  // header-spacing-and-icon-alignment: the icon cluster reverses from
  // right-aligned (against the rail's right edge) to left-aligned (against
  // the rail's left edge, matching PageOutline's own xl:px-5 content) — the
  // MODIFIED "Header icons align with the right rail column" requirement.
  it("left-aligns the xl icon cluster to the rail's left edge, not right-aligned", () => {
    const { container } = renderHeader();
    const columns = Array.from(container.querySelectorAll(":scope > div")).filter(
      (el) => el.getAttribute("data-testid") !== "mobile-header"
    );
    const iconColumn = columns[2];
    expect(iconColumn.className).toContain("xl:justify-start");
    expect(iconColumn.className).toContain("xl:pl-5");
    expect(iconColumn.className).not.toContain("xl:justify-end");
    expect(iconColumn.className).not.toContain("xl:pr-5");
  });

  // mobile-app-shell
  it("renders the wordmark and tagline as plain text (no button styling) in the mobile row, linking to /", () => {
    renderHeader();
    const mobileHeader = screen.getByTestId("mobile-header");
    const wordmarkLink = within(mobileHeader).getByRole("link", { name: /FARPOST/ });
    expect(wordmarkLink).toHaveAttribute("href", "/");
    expect(wordmarkLink.className).not.toMatch(/border|rounded|bg-/);
    expect(within(mobileHeader).getByText("Building intelligence for rural Canada")).toBeInTheDocument();
  });

  it("renders the mobile icon cluster in order: sign-in/profile, hamburger, settings", () => {
    renderHeader();
    const cluster = screen.getByTestId("mobile-icon-cluster");
    const labels = Array.from(cluster.children).map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual(["Sign in", "Your account", "Open navigation", "Site settings"]);
  });

  // Real computed visibility from globals.css's [data-signed-in] rules isn't
  // measurable in jsdom (no stylesheet is loaded in tests) — this guards the
  // structural invariant instead: both links exist, tagged with the classes
  // the CSS toggle depends on, wired to the right destinations.
  it("renders both sign-in and profile links, tagged for the signed-in/signed-out CSS toggle", () => {
    renderHeader();
    const cluster = screen.getByTestId("mobile-icon-cluster");
    const signIn = within(cluster).getByRole("link", { name: "Sign in" });
    const profile = within(cluster).getByRole("link", { name: "Your account" });
    expect(signIn.className).toContain("signed-out-only");
    expect(signIn).toHaveAttribute("href", "/sign-in");
    expect(profile.className).toContain("signed-in-only");
    expect(profile).toHaveAttribute("href", "/account");
  });

  it("opens the mobile navigation when the hamburger is tapped", () => {
    render(
      <MobileNavProvider>
        <Header />
        <DrawerNav />
      </MobileNavProvider>
    );
    const nav = screen.getByRole("navigation", { name: "Site" });
    expect(nav.className).toContain("-translate-x-full");
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(nav.className).toContain("translate-x-0");
  });
});
