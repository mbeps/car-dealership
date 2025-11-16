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

// Public routes
export const ROUTES = {
  HOME: "/",
  CARS: BASE_PATHS.CARS,
  CAR_DETAILS: (carId: string) => `${BASE_PATHS.CARS}/${carId}`,

  // Auth routes
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  AUTH_CALLBACK: "/auth/callback",

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
 * Routes that require authentication
 */
export const PROTECTED_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.SAVED_CARS,
  ROUTES.RESERVATIONS,
] as const;

/**
 * Helper function to create a sign-in redirect URL
 */
export function createSignInRedirect(redirectPath: string): string {
  return `${ROUTES.SIGN_IN}?redirect=${encodeURIComponent(redirectPath)}`;
}

/**
 * Helper function to create a car search URL with query parameters
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
