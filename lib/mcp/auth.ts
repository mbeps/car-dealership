import {
  type AuthInfo,
  OAuthError,
  OAuthErrorCode,
} from "@modelcontextprotocol/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrCreateDbUser } from "@/actions/cars/get-or-create-db-user";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { createClient, createTokenClient } from "@/lib/supabase/supabase";

export interface McpAuthContext {
  authUserId: string;
  userId: string;
  email: string;
  role: UserRole;
  supabase: SupabaseClient;
}

/**
 * Safely extracts the expiration timestamp (`exp`) from a JWT string.
 */
function parseJwtExp(token: string): number | undefined {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Token verifier for withMcpAuth.
 * Handles Bearer tokens and SSR cookie fallbacks.
 * Throws OAuthError(InvalidToken) on explicit invalid bearer tokens
 * to prevent silent downgrade to Guest.
 *
 * @param req - Incoming HTTP request
 * @param bearerToken - Bearer token extracted from Authorization header
 * @returns AuthInfo for authenticated users, or undefined for guest
 */
export async function verifyMcpToken(
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  // Case 1: Explicit Bearer token in Authorization header
  if (bearerToken) {
    const supabase = createTokenClient(bearerToken);
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser(bearerToken);

    if (error || !authUser) {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        "Invalid or expired bearer token",
      );
    }

    const dbUser = await getOrCreateDbUser(supabase, authUser);
    const role = (dbUser.role as UserRole) || UserRole.USER;
    const expiresAt = parseJwtExp(bearerToken);

    const authContext: McpAuthContext = {
      authUserId: authUser.id,
      userId: dbUser.id,
      email: authUser.email ?? "",
      role,
      supabase,
    };

    return {
      clientId: authUser.id,
      token: bearerToken,
      scopes: role === UserRole.ADMIN ? ["user", "admin"] : ["user"],
      ...(expiresAt ? { expiresAt } : {}),
      extra: authContext as unknown as Record<string, unknown>,
    };
  }

  // Case 2: SSR cookie fallback if cookies are present
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const dbUser = await getOrCreateDbUser(supabase, authUser);
        const role = (dbUser.role as UserRole) || UserRole.USER;

        const authContext: McpAuthContext = {
          authUserId: authUser.id,
          userId: dbUser.id,
          email: authUser.email ?? "",
          role,
          supabase,
        };

        return {
          clientId: authUser.id,
          token: "cookie-session",
          scopes: role === UserRole.ADMIN ? ["user", "admin"] : ["user"],
          extra: authContext as unknown as Record<string, unknown>,
        };
      }
    } catch {
      // Cookie session lookup failed, fall through to Guest
    }
  }

  // Case 3: Check if auth is explicitly required via ?auth=required query param
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("auth") === "required") {
      throw new OAuthError(
        OAuthErrorCode.InvalidToken,
        "Authentication required",
      );
    }
  } catch (err) {
    if (err instanceof OAuthError) throw err;
  }

  // Case 4: Unauthenticated (Guest)
  return undefined;
}

/**
 * Retrieves the McpAuthContext from the tool execution context.
 *
 * @param ctx - ServerContext passed to MCP tool
 * @returns McpAuthContext if authenticated, null otherwise
 */
export function getMcpAuth(ctx: unknown): McpAuthContext | null {
  const context = ctx as
    | { http?: { authInfo?: AuthInfo }; authInfo?: AuthInfo }
    | undefined;
  const authInfo = context?.http?.authInfo ?? context?.authInfo;
  if (!authInfo?.extra) return null;
  return authInfo.extra as unknown as McpAuthContext;
}

/**
 * Requires that the caller is authenticated as at least USER.
 * Throws an error if unauthenticated.
 *
 * @param ctx - ServerContext passed to MCP tool
 * @returns McpAuthContext
 */
export function requireUser(ctx: unknown): McpAuthContext {
  const auth = getMcpAuth(ctx);
  if (!auth) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return auth;
}

/**
 * Requires that the caller is authenticated as ADMIN.
 * Throws an error if unauthenticated or not an admin.
 *
 * @param ctx - ServerContext passed to MCP tool
 * @returns McpAuthContext
 */
export function requireAdmin(ctx: unknown): McpAuthContext {
  const auth = requireUser(ctx);
  if (auth.role !== UserRole.ADMIN) {
    throw new Error("Forbidden: Admin role required.");
  }
  return auth;
}
