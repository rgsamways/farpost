import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_STORAGE_KEY } from "@/lib/reducedMotion";
import ReducedMotionSetting from "./ReducedMotionSetting";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe("ReducedMotionSetting", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("reduce-motion");
    mockMatchMedia(false);
  });

  it("defaults to System when nothing is stored", () => {
    render(<ReducedMotionSetting />);
    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true");
  });

  it("resolves the previously stored preference on mount", () => {
    localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, "off");
    render(<ReducedMotionSetting />);
    expect(screen.getByRole("button", { name: "Off" })).toHaveAttribute("aria-pressed", "true");
  });

  it("persists the selection and toggles the reduce-motion class on <html> immediately", () => {
    render(<ReducedMotionSetting />);

    fireEvent.click(screen.getByRole("button", { name: "On" }));
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe("on");
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(localStorage.getItem(REDUCED_MOTION_STORAGE_KEY)).toBe("off");
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(false);
  });
});
