import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useSession = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => useSession(),
    signIn: { magicLink: vi.fn() },
  },
}));

describe("SignInPage", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("redirects to /account when a session already exists", () => {
    useSession.mockReturnValue({ data: { user: { email: "already@signed-in.com" } }, isPending: false });
    render(<SignInPage />);
    expect(replace).toHaveBeenCalledWith("/account");
  });

  it("renders the sign-in form when signed out", () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    render(<SignInPage />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send sign-in link" })).toBeInTheDocument();
  });
});
