import { ROUTES } from "@/config/routes";

/**
 * Validates and sanitizes a redirect target path to prevent open redirect vulnerabilities.
 * Ensures the path is relative, starts with a single "/", and contains no scheme or protocol-relative prefixes.
 *
 * @param redirectParam - Candidate redirect path or query value.
 * @param fallback - Safe internal fallback path if invalid (defaults to home "/").
 * @returns Safe internal relative path including any query parameters.
 */
export function getSafeRedirectPath(
  redirectParam?: string | null,
  fallback: string = ROUTES.HOME.HOME,
): string {
  if (!redirectParam || typeof redirectParam !== "string") {
    return fallback;
  }

  const trimmed = redirectParam.trim();

  // Must begin with a single "/" and not double "//" (protocol-relative) or "/\"
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return fallback;
  }

  // Reject URLs with whitespace, backslashes, or ASCII control characters
  if (/\s|\\/.test(trimmed)) {
    return fallback;
  }

  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code === 127) {
      return fallback;
    }
  }

  // Ensure it cannot be parsed as an absolute URL with a protocol
  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Pathname must still be relative and origin must match localhost
    if (
      parsed.origin !== "http://localhost" ||
      !parsed.pathname.startsWith("/")
    ) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Constructs a fully qualified `/auth/callback` URL with a properly encoded `redirect` query parameter.
 * Prevents nested query parameters from breaking during OAuth / email verification redirects.
 *
 * @param siteUrl - Base site origin (e.g. "https://car-dealership.maruf-bepary.com").
 * @param redirectPath - Target destination after authentication.
 * @returns Fully qualified callback URL.
 */
export function buildAuthCallbackRedirectUrl(
  siteUrl: string,
  redirectPath?: string | null,
): string {
  const safePath = getSafeRedirectPath(redirectPath);
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  return `${normalizedSiteUrl}${ROUTES.AUTH.AUTH_CALLBACK}?redirect=${encodeURIComponent(safePath)}`;
}
