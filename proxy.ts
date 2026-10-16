import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import type { CookieOptions } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import { env } from "@/config/env";
import { PROTECTED_ROUTES, ROUTES } from "@/config/routes";
import { createSignInRedirect } from "@/lib/route/create-sign-in-redirect";

// Protected routes that require authentication
const protectedRoutes = PROTECTED_ROUTES;

/**
 * Checks if pathname requires authentication.
 *
 * @param pathname - Request pathname
 * @returns True if route is protected
 * @see PROTECTED_ROUTES - List of protected routes
 */
const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some((route) => pathname.startsWith(route));
};

/**
 * Checks if pathname is an MCP or RFC 9728 discovery endpoint.
 * These endpoints retain Arcjet Shield WAF protection but bypass
 * browser-only detectBot checks and cookie refresh proxies.
 */
const isMcpRoute = (pathname: string): boolean => {
  return (
    pathname === "/api/mcp" ||
    pathname.startsWith("/api/mcp/") ||
    pathname === "/.well-known/oauth-protected-resource" ||
    pathname.startsWith("/.well-known/")
  );
};

/**
 * Arcjet security proxy for browser and general web routes.
 * Enables shield protection and bot detection.
 * Allows search engine crawlers.
 *
 * @see https://arcjet.com/bot-list
 */
const ajBrowser = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
      ],
    }),
  ],
});

/**
 * Arcjet security proxy for MCP endpoints.
 * Protects via Shield WAF while permitting MCP clients (Claude, Cursor, Copilot).
 */
const ajMcp = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),
  ],
});

/**
 * Supabase session management proxy.
 * Refreshes expired sessions via cookies.
 * Redirects authenticated users away from auth pages.
 * Enforces protection on PROTECTED_ROUTES.
 *
 * @param request - Incoming request
 * @returns Response with updated cookies or redirect
 * @see createSignInRedirect - Builds sign-in URL with return path
 */
async function supabaseProxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (pathname === ROUTES.AUTH.SIGN_IN || pathname === ROUTES.AUTH.SIGN_UP)
  ) {
    return NextResponse.redirect(new URL(ROUTES.HOME.HOME, request.url));
  }

  // Redirect to sign-in if accessing protected route without auth
  if (isProtectedRoute(pathname) && !user) {
    const redirectUrl = new URL(createSignInRedirect(pathname), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

/**
 * Pre-configured middleware for browser traffic (Arcjet shield + detectBot + Supabase session proxy).
 */
const browserMiddleware = createMiddleware(ajBrowser, supabaseProxy);

/**
 * Main application proxy pipeline.
 * Routes MCP and RFC 9728 discovery requests through ajMcp (WAF only)
 * and web requests through browserMiddleware.
 *
 * @see https://arcjet.com/docs/nextjs/reference/middleware
 */
export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const pathname = request.nextUrl.pathname;

  if (isMcpRoute(pathname)) {
    const decision = await ajMcp.protect(request);
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { code: 429, message: "Too Many Requests" },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { code: 403, message: "Forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  return browserMiddleware(request, event);
}
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
