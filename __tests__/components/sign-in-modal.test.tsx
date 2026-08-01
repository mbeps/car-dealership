import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SignInModal } from "@/components/sign-in-modal";

const mockOnClose = vi.fn();
const mockUseSignIn = vi.fn();

vi.mock("@/hooks/useAuthModal", () => ({
  default: () => ({
    isOpen: true,
    onClose: mockOnClose,
    redirectUrl: undefined,
  }),
}));

vi.mock("@/hooks/use-sign-in", () => ({
  useSignIn: () => mockUseSignIn(),
}));

describe("SignInModal passkey UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignIn.mockReturnValue({
      loading: false,
      error: "",
      success: "",
      supportsPasskeys: true,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithPasskey: vi.fn(),
      registerPasskey: vi.fn(),
    });
  });

  it("shows the passkey option when WebAuthn is supported", async () => {
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: class MockPublicKeyCredential {},
    });

    render(<SignInModal />);

    expect(
      screen.getByRole("button", { name: /continue with a passkey/i }),
    ).toBeInTheDocument();
  });

  it("hides the passkey option when WebAuthn is unavailable", () => {
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      value: undefined,
    });

    mockUseSignIn.mockReturnValue({
      loading: false,
      error: "",
      success: "",
      supportsPasskeys: false,
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithPasskey: vi.fn(),
      registerPasskey: vi.fn(),
    });

    render(<SignInModal />);

    expect(
      screen.queryByRole("button", { name: /continue with a passkey/i }),
    ).not.toBeInTheDocument();
  });
});
