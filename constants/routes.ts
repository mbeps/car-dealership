/**
 * Centralized route definitions for the application.
 * All route strings are defined here to ensure consistency and ease of maintenance.
 */

const ADMIN_BASE = "/admin";
const CARS_BASE = "/cars";
const CAR_DETAILS = (carId: string) => `${CARS_BASE}/${carId}`;
const TEST_DRIVE_BASE = "/test-drive";
const TEST_DRIVE_DETAILS = (carId: string) => `${TEST_DRIVE_BASE}/${carId}`;

const ADMIN_CARS = `${ADMIN_BASE}/cars`;
const ADMIN_CAR_CREATE = `${ADMIN_CARS}/create`;
const ADMIN_CAR_EDIT = (carId: string) => `${ADMIN_CARS}/${carId}/edit`;
const ADMIN_TEST_DRIVES = `${ADMIN_BASE}/test-drives`;
const ADMIN_SETTINGS = `${ADMIN_BASE}/settings`;

/**
 * Centralized route constants.
 * Used across server/client code for navigation and redirects.
 * Dynamic routes are functions to ensure type safety.
 *
 * @see proxy.ts - Uses PROTECTED_ROUTES
 * @see createCarSearchUrl - Helper for cars listing URL generation
 */
export const ROUTES = {
  HOME: {
    HOME: "/",
    CARS: CARS_BASE,
    CAR_DETAILS: CAR_DETAILS,
  },

  AUTH: {
    SIGN_IN: "/sign-in",
    SIGN_UP: "/sign-up",
    AUTH_CALLBACK: "/auth/callback",
    FORGOT_PASSWORD: "/forgot-password",
    UPDATE_PASSWORD: "/update-password",
  },

  SAVED_CARS: "/saved-cars",
  RESERVATIONS: "/reservations",
  TEST_DRIVE: TEST_DRIVE_DETAILS,

  ADMIN: {
    ADMIN: ADMIN_BASE,
    ADMIN_CARS: ADMIN_CARS,
    ADMIN_CAR_CREATE: ADMIN_CAR_CREATE,
    ADMIN_CAR_EDIT: ADMIN_CAR_EDIT,
    ADMIN_TEST_DRIVES: ADMIN_TEST_DRIVES,
    ADMIN_SETTINGS: ADMIN_SETTINGS,
  },
} as const;

/**
 * Routes requiring authentication.
 * Middleware redirects unauthenticated users to sign-in.
 *
 * @see middleware.ts - Enforces these protections
 */
export const PROTECTED_ROUTES = [
  ROUTES.ADMIN.ADMIN,
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
  return `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirectPath)}`;
}

/**
 * Builds car listing URL with query params.
 * Filters out empty values for clean URLs.
 *
 * @param params - Filter params (make, bodyType, etc.)
 * @returns Cars URL with query string
 * @see ROUTES.HOME.CARS - Base car listing route
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
  return query ? `${ROUTES.HOME.CARS}?${query}` : ROUTES.HOME.CARS;
}
