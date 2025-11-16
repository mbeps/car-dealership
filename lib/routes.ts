/**
 * Centralized route definitions for the application.
 * All route strings are defined here to ensure consistency and ease of maintenance.
 */

// Base paths to avoid repetition
const BASE_PATHS = {
  ADMIN: "/admin",
  CARS: "/cars",
  TEST_DRIVE: "/test-drive",
} as const;

// Intermediate paths
const ADMIN_PATHS = {
  CARS: `${BASE_PATHS.ADMIN}/cars`,
  TEST_DRIVES: `${BASE_PATHS.ADMIN}/test-drives`,
  SETTINGS: `${BASE_PATHS.ADMIN}/settings`,
} as const;

/**
 * Centralized route constants.
 * Used across server/client code for navigation and redirects.
 * Dynamic routes are functions to ensure type safety.
 *
 * @see middleware.ts - Uses PROTECTED_ROUTES
 * @see createSignInRedirect - Helper for auth redirects
 */
export const ROUTES = {
  HOME: "/",
  CARS: BASE_PATHS.CARS,
  CAR_DETAILS: (carId: string) => `${BASE_PATHS.CARS}/${carId}`,

  // Auth routes
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  AUTH_CALLBACK: "/auth/callback",
  FORGOT_PASSWORD: "/forgot-password",
  UPDATE_PASSWORD: "/update-password",

  // Main app routes (authenticated users)
  SAVED_CARS: "/saved-cars",
  RESERVATIONS: "/reservations",
  TEST_DRIVE: (carId: string) => `${BASE_PATHS.TEST_DRIVE}/${carId}`,

  // Admin routes
  ADMIN: BASE_PATHS.ADMIN,
  ADMIN_CARS: ADMIN_PATHS.CARS,
  ADMIN_CAR_CREATE: `${ADMIN_PATHS.CARS}/create`,
  ADMIN_CAR_EDIT: (carId: string) => `${ADMIN_PATHS.CARS}/${carId}/edit`,
  ADMIN_TEST_DRIVES: ADMIN_PATHS.TEST_DRIVES,
  ADMIN_SETTINGS: ADMIN_PATHS.SETTINGS,
} as const;

/**
 * Routes requiring authentication.
 * Middleware redirects unauthenticated users to sign-in.
 *
 * @see middleware.ts - Enforces these protections
 */
export const PROTECTED_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.SAVED_CARS,
  ROUTES.RESERVATIONS,
] as const;

/**
 * Builds sign-in URL with return path.
 * Preserves original destination after auth.
 *
 * @param redirectPath - Where to redirect after sign-in
 * @returns Sign-in URL with redirect param
 * @see middleware.ts - Creates these redirects
 */
export function createSignInRedirect(redirectPath: string): string {
  return `${ROUTES.SIGN_IN}?redirect=${encodeURIComponent(redirectPath)}`;
}

/**
 * Builds car listing URL with query params.
 * Filters out empty values for clean URLs.
 *
 * @param params - Filter params (make, bodyType, etc.)
 * @returns Cars URL with query string
 * @see ROUTES.CARS - Base car listing route
 */
export function createCarSearchUrl(params: {
  search?: string;
  make?: string;
  bodyType?: string;
  [key: string]: string | undefined;
}): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `${ROUTES.CARS}?${query}` : ROUTES.CARS;
}
