import { describe, it, expect, vi, beforeEach } from "vitest";

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(() => ({ auth: "server-client" })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  },
}));

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/supabase";

const mockedCookies = vi.mocked(cookies);

function makeCookieStore(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    getAll: vi.fn(() => [{ name: "sb-token", value: "abc" }]),
    set: vi.fn(),
    ...overrides,
  };
}

describe("createClient (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCookies.mockResolvedValue(makeCookieStore() as never);
  });

  it("reads cookies from next/headers and passes env credentials", async () => {
    await createClient();

    expect(mockedCookies).toHaveBeenCalled();
    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
  });

  it("wires getAll to the cookie store", async () => {
    const store = makeCookieStore();
    mockedCookies.mockResolvedValue(store as never);

    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    expect(config.cookies.getAll()).toEqual([
      { name: "sb-token", value: "abc" },
    ]);
    expect(store.getAll).toHaveBeenCalled();
  });

  it("setAll writes each cookie with name, value and options", async () => {
    const store = makeCookieStore();
    mockedCookies.mockResolvedValue(store as never);

    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    config.cookies.setAll([
      { name: "a", value: "1", options: { httpOnly: true } },
      { name: "b", value: "2", options: {} },
    ]);

    expect(store.set).toHaveBeenNthCalledWith(1, "a", "1", { httpOnly: true });
    expect(store.set).toHaveBeenNthCalledWith(2, "b", "2", {});
  });

  it("swallows errors from cookie writes (Server Component context)", async () => {
    const store = makeCookieStore({
      set: vi.fn(() => {
        throw new Error("read-only");
      }),
    });
    mockedCookies.mockResolvedValue(store as never);

    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    expect(() =>
      config.cookies.setAll([{ name: "a", value: "1", options: {} }]),
    ).not.toThrow();
  });

  it("aborts remaining cookie writes when one fails (single try/catch)", async () => {
    const store = makeCookieStore({
      set: vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("read-only");
        })
        .mockImplementationOnce(() => {}),
    });
    mockedCookies.mockResolvedValue(store as never);

    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    expect(() =>
      config.cookies.setAll([
        { name: "a", value: "1", options: {} },
        { name: "b", value: "2", options: {} },
      ]),
    ).not.toThrow();
    // ponytail: forEach inside one try/catch means a failed write skips the rest — assert that ceiling
    expect(store.set).toHaveBeenCalledTimes(1);
  });

  it("configures PKCE flow with passkey support for SSR auth", async () => {
    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    expect(config.auth.flowType).toBe("pkce");
    expect(config.auth.experimental.passkey).toBe(true);
  });

  it("does not persist sessions server-side but allows token refresh", async () => {
    await createClient();

    const config = createServerClientMock.mock.calls[0][2];
    expect(config.auth.persistSession).toBe(false);
    expect(config.auth.autoRefreshToken).toBe(true);
    expect(config.auth.detectSessionInUrl).toBe(false);
  });

  it("returns the client produced by createServerClient", async () => {
    const client = await createClient();

    expect(client).toEqual({ auth: "server-client" });
  });
});
