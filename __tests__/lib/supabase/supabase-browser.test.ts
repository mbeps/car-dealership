import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(() => ({ auth: "browser-client" })),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  },
}));

import { createBrowserClient } from "@/lib/supabase/supabase-client";

describe("createBrowserClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes env URL and anon key", () => {
    createBrowserClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key",
      expect.objectContaining({ auth: expect.any(Object) }),
    );
  });

  it("uses PKCE flow with passkey support enabled", () => {
    createBrowserClient();

    const config = createBrowserClientMock.mock.calls[0][2];
    expect(config.auth.flowType).toBe("pkce");
    expect(config.auth.experimental.passkey).toBe(true);
  });

  it("persists sessions and auto-refreshes tokens in the browser", () => {
    createBrowserClient();

    const config = createBrowserClientMock.mock.calls[0][2];
    expect(config.auth.persistSession).toBe(true);
    expect(config.auth.autoRefreshToken).toBe(true);
  });

  it("detects sessions in the URL for OAuth/PKCE redirects", () => {
    createBrowserClient();

    const config = createBrowserClientMock.mock.calls[0][2];
    expect(config.auth.detectSessionInUrl).toBe(true);
  });

  it("returns the client produced by createBrowserClient", () => {
    const client = createBrowserClient();

    expect(client).toEqual({ auth: "browser-client" });
  });
});
