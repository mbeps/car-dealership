import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountDialog } from "@/components/header/account-dialog";

const mockUseUser = vi.fn();
const mockUseSignIn = vi.fn();
const mockListPasskeys = vi.fn();
const mockUpdatePasskey = vi.fn();
const mockDeletePasskey = vi.fn();
const mockRegisterPasskey = vi.fn();

vi.mock("@/hooks/useUser", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/hooks/use-sign-in", () => ({
  useSignIn: () => mockUseSignIn(),
}));

vi.mock("@/components/ui/responsive-drawer-dialog", () => ({
  ResponsiveDrawerDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/supabase/supabase-client", () => ({
  createBrowserClient: () => ({
    auth: {
      passkey: {
        list: mockListPasskeys,
        update: mockUpdatePasskey,
        delete: mockDeletePasskey,
      },
    },
  }),
}));

describe("AccountDialog passkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      user: { id: "user-1", email: "user@example.com" },
      userDetails: {
        name: "Test User",
        email: "user@example.com",
        role: "Admin",
      },
      isLoading: false,
    });
    mockUseSignIn.mockReturnValue({
      loading: false,
      error: "",
      success: "",
      supportsPasskeys: true,
      registerPasskey: mockRegisterPasskey,
    });
  });

  it("shows an empty state when no passkeys are available", async () => {
    mockListPasskeys.mockResolvedValue({ data: [], error: null });

    render(<AccountDialog />);

    await waitFor(() => {
      expect(screen.getByText(/no passkeys yet/i)).toBeInTheDocument();
    });
  });

  it("renames a passkey through the passkey API", async () => {
    mockListPasskeys.mockResolvedValue({
      data: [
        {
          id: "passkey-1",
          friendly_name: "Work laptop",
          created_at: "2024-01-01",
        },
      ],
      error: null,
    });
    mockUpdatePasskey.mockResolvedValue({
      data: {
        id: "passkey-1",
        friendly_name: "Home laptop",
        created_at: "2024-01-01",
      },
      error: null,
    });

    render(<AccountDialog />);

    await waitFor(() => {
      expect(screen.getByText("Work laptop")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /rename/i }));

    const input = screen.getByDisplayValue("Work laptop");
    fireEvent.change(input, { target: { value: "Home laptop" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdatePasskey).toHaveBeenCalledWith({
        passkeyId: "passkey-1",
        friendlyName: "Home laptop",
      });
    });
  });
});
