import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublishableKey, getSupabaseUrl } from "./lib/supabase-env";
import { PROTECTED_ROUTES, ROUTES, createSignInRedirect } from "./lib/routes";

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
 * Arcjet security middleware.
 * Enables shield protection and bot detection.
 * Allows search engine crawlers.
 *
 * @see https://arcjet.com/bot-list
 */
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield protection for content and security
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        // See the full list at https://arcjet.com/bot-list
      ],
    }),
  ],
});

/**
 * Supabase session management middleware.
 * Refreshes expired sessions via cookies.
 * Redirects authenticated users away from auth pages.
 * Enforces protection on PROTECTED_ROUTES.
 *
 * @param request - Incoming request
 * @returns Response with updated cookies or redirect
 * @see createSignInRedirect - Builds sign-in URL with return path
 */
async function supabaseMiddleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users away from auth pages
  if (user && (pathname === ROUTES.SIGN_IN || pathname === ROUTES.SIGN_UP)) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  // Redirect to sign-in if accessing protected route without auth
  if (isProtectedRoute(pathname) && !user) {
    const redirectUrl = new URL(createSignInRedirect(pathname), request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

/**
 * Chained middleware pipeline.
 * Arcjet runs first for security, then Supabase for auth.
 *
 * @see https://arcjet.com/docs/nextjs/reference/middleware
 */
export default createMiddleware(aj, supabaseMiddleware);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
