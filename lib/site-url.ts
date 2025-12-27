/**
 * Returns the absolute site URL based on environment.
 * Prioritizes NEXT_PUBLIC_SITE_URL, then Vercel URL, then localhost.
 * Ensures protocol (https/http) and no trailing slash.
 */
export function getSiteUrl() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  url = url.includes("http") ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === "/" ? url.slice(0, -1) : url;
  return url;
}
