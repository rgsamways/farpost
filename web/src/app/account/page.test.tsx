import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useSession = vi.fn();
const signOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => useSession(),
    signOut: () => signOut(),
  },
}));

describe("AccountPage", () => {
  beforeEach(() => {
    replace.mockClear();
    signOut.mockClear();
  });

  it("redirects to /sign-in when no session exists", () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    render(<AccountPage />);
    expect(replace).toHaveBeenCalledWith("/sign-in");
  });

  it("displays the signed-in user's real email and does not redirect", () => {
    useSession.mockReturnValue({ data: { user: { email: "real@example.com" } }, isPending: false });
    render(<AccountPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("real@example.com")).toBeInTheDocument();
  });

  it("ends the session and redirects to /sign-in when sign-out is activated", async () => {
    useSession.mockReturnValue({ data: { user: { email: "real@example.com" } }, isPending: false });
    render(<AccountPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await vi.waitFor(() => expect(signOut).toHaveBeenCalled());
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/sign-in"));
  });
});
