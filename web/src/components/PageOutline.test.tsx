import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PageOutline from "./PageOutline";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// PageOutline scans the real document for `main h2[id]` rather than reading
// props, so each test renders its own <main> alongside <PageOutline /> —
// mirroring how they're real DOM siblings (not nested) in the app shell.
describe("PageOutline", () => {
  it("renders no outline when the page has fewer than 2 sections", () => {
    render(
      <>
        <main>
          <h2 id="only-one">Only One</h2>
        </main>
        <PageOutline />
      </>
    );
    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
  });

  it("renders an outline listing every section once at or above the minimum", () => {
    render(
      <>
        <main>
          <h2 id="first-section">First Section</h2>
          <h2 id="second-section">Second Section</h2>
        </main>
        <PageOutline />
      </>
    );
    expect(screen.getByText("On this page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First Section" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Second Section" })).toBeInTheDocument();
  });
});
