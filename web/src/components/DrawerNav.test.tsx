import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DrawerNav from "./DrawerNav";
import { MobileNavProvider } from "./MobileNavContext";

// "/jobs/open" (not "/dashboard") so the Jobs group's auto-expand-when-active
// behavior (navTree's isExpanded/pathMatches) renders its children —
// otherwise they're collapsed by default and the link assertions below
// would fail for the wrong reason.
vi.mock("next/navigation", () => ({
  usePathname: () => "/jobs/open",
}));

function renderNav() {
  return render(
    <MobileNavProvider>
      <DrawerNav />
    </MobileNavProvider>
  );
}

describe("DrawerNav", () => {
  it("renders the three real nav groups with their links and children", () => {
    renderNav();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buildings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completed" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Professionals" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Requests" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
  });

  it("does not render a 'Farpost' label inside the left navigation column", () => {
    renderNav();
    const sidebar = screen.getByRole("navigation", { name: "Site" });
    expect(sidebar).not.toHaveTextContent("Farpost");
  });
});
