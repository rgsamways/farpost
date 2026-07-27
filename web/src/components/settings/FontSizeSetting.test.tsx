import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { FONT_SCALE_STORAGE_KEY } from "@/lib/fontScale";
import FontSizeSetting from "./FontSizeSetting";

describe("FontSizeSetting", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--font-scale");
  });

  it("defaults to Default when nothing is stored", () => {
    render(<FontSizeSetting />);
    expect(screen.getByRole("button", { name: "Default" })).toHaveAttribute("aria-pressed", "true");
  });

  it("resolves the previously stored scale on mount", () => {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, "large");
    render(<FontSizeSetting />);
    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute("aria-pressed", "true");
  });

  it("persists the selection and updates --font-scale immediately", () => {
    render(<FontSizeSetting />);
    fireEvent.click(screen.getByRole("button", { name: "Extra Large" }));
    expect(localStorage.getItem(FONT_SCALE_STORAGE_KEY)).toBe("xlarge");
    expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.25");
    expect(screen.getByRole("button", { name: "Extra Large" })).toHaveAttribute("aria-pressed", "true");
  });
});
