import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SettingsPage from "./page";

describe("SettingsPage", () => {
  it("renders the font size and reduced motion controls, and no theme control", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("group", { name: "Font size" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Reduced motion" })).toBeInTheDocument();
    expect(screen.queryByText(/theme/i)).not.toBeInTheDocument();
  });
});
