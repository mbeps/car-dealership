import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const pushMock = vi.fn();
  const getUserMock = vi.fn();
  const getAuthorizationDetailsMock = vi.fn();
  const approveAuthorizationMock = vi.fn();
  const denyAuthorizationMock = vi.fn();

  return {
    pushMock,
    getUserMock,
    getAuthorizationDetailsMock,
    approveAuthorizationMock,
    denyAuthorizationMock,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: h.pushMock,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/supabase-client", () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: h.getUserMock,
      oauth: {
        getAuthorizationDetails: h.getAuthorizationDetailsMock,
        approveAuthorization: h.approveAuthorizationMock,
        denyAuthorization: h.denyAuthorizationMock,
      },
    },
  }),
}));

import { OAuthConsentCard } from "@/app/(auth)/oauth/consent/_components/oauth-consent-card";

describe("OAuthConsentCard & useOAuthConsent", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        ...originalLocation,
        assign: vi.fn(),
      },
    });

    h.getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "testuser@example.com" },
      },
      error: null,
    });
  });

  it("renders error state when authorizationId is missing", async () => {
    render(<OAuthConsentCard authorizationId={null} />);

    await waitFor(() => {
      expect(screen.getByText("Authorization Failed")).toBeInTheDocument();
      expect(
        screen.getByText(/No authorization ID provided/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Return to Home")).toBeInTheDocument();
    });
  });

  it("redirects unauthenticated users to sign-in with preserved redirect return URL", async () => {
    h.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(<OAuthConsentCard authorizationId="auth-req-456" />);

    await waitFor(() => {
      expect(h.pushMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "/sign-in?redirect=%2Foauth%2Fconsent%3Fauthorization_id%3Dauth-req-456",
        ),
      );
    });
  });

  it("auto-redirects when user has already consented previously", async () => {
    h.getAuthorizationDetailsMock.mockResolvedValue({
      data: {
        redirect_url:
          "https://gemini.google.com/callback?code=already-granted-code",
      },
      error: null,
    });

    render(<OAuthConsentCard authorizationId="auth-req-456" />);

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://gemini.google.com/callback?code=already-granted-code",
      );
    });
  });

  it("renders consent card with client name, email, and handles approval", async () => {
    h.getAuthorizationDetailsMock.mockResolvedValue({
      data: {
        authorization_id: "auth-req-789",
        redirect_uri: "https://gemini.google.com/callback",
        scope: "openid profile email",
        client: {
          id: "client-gemini",
          name: "Google Gemini",
          uri: "https://gemini.google.com",
          logo_uri: "",
        },
        user: {
          id: "user-123",
          email: "testuser@example.com",
        },
      },
      error: null,
    });

    h.approveAuthorizationMock.mockResolvedValue({
      data: {
        redirect_url:
          "https://gemini.google.com/callback?code=newly-approved-code",
      },
      error: null,
    });

    render(<OAuthConsentCard authorizationId="auth-req-789" />);

    // Wait for client name and user email to be rendered
    await waitFor(() => {
      expect(screen.getByText("Authorize Access")).toBeInTheDocument();
      expect(screen.getByText("Google Gemini")).toBeInTheDocument();
      expect(screen.getByText("testuser@example.com")).toBeInTheDocument();
    });

    // Click Allow Access button
    const approveButton = screen.getByRole("button", { name: /Allow Access/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(h.approveAuthorizationMock).toHaveBeenCalledWith("auth-req-789", {
        skipBrowserRedirect: true,
      });
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://gemini.google.com/callback?code=newly-approved-code",
      );
    });
  });

  it("handles denial correctly and redirects with error payload", async () => {
    h.getAuthorizationDetailsMock.mockResolvedValue({
      data: {
        authorization_id: "auth-req-789",
        redirect_uri: "https://claude.ai/callback",
        scope: "openid",
        client: {
          id: "client-claude",
          name: "Claude",
          uri: "https://claude.ai",
          logo_uri: "",
        },
        user: {
          id: "user-123",
          email: "testuser@example.com",
        },
      },
      error: null,
    });

    h.denyAuthorizationMock.mockResolvedValue({
      data: {
        redirect_url: "https://claude.ai/callback?error=access_denied",
      },
      error: null,
    });

    render(<OAuthConsentCard authorizationId="auth-req-789" />);

    await waitFor(() => {
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });

    // Click Deny button
    const denyButton = screen.getByRole("button", { name: /Deny/i });
    fireEvent.click(denyButton);

    await waitFor(() => {
      expect(h.denyAuthorizationMock).toHaveBeenCalledWith("auth-req-789", {
        skipBrowserRedirect: true,
      });
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://claude.ai/callback?error=access_denied",
      );
    });
  });
});
