/**
 * Centralized route definitions for the application.
 * Source of truth for path strings and dynamic URL helpers only.
 */

const ADMIN_BASE = "/admin";
const CARS_BASE = "/cars";
const TEST_DRIVE_BASE = "/test-drive";
const ADMIN_CARS = `${ADMIN_BASE}/cars`;

export const ROUTES = {
  HOME: {
    HOME: "/",
    CARS: CARS_BASE,
    CAR_DETAILS: (carId: string) => `${CARS_BASE}/${carId}`,
  },

  AUTH: {
    SIGN_IN: "/sign-in",
    SIGN_UP: "/sign-up",
    AUTH_CALLBACK: "/auth/callback",
    FORGOT_PASSWORD: "/forgot-password",
    UPDATE_PASSWORD: "/update-password",
    OAUTH_CONSENT: "/oauth/consent",
  },

  SAVED_CARS: "/saved-cars",
  RESERVATIONS: "/reservations",
  TEST_DRIVE: (carId: string) => `${TEST_DRIVE_BASE}/${carId}`,

  ADMIN: {
    ADMIN: ADMIN_BASE,
    ADMIN_CARS: ADMIN_CARS,
    ADMIN_CAR_CREATE: `${ADMIN_CARS}/create`,
    ADMIN_CAR_EDIT: (carId: string) => `${ADMIN_CARS}/${carId}/edit`,
    ADMIN_TEST_DRIVES: `${ADMIN_BASE}/test-drives`,
    ADMIN_SETTINGS: `${ADMIN_BASE}/settings`,
  },

  API: {
    MCP: "/api/mcp",
    OAUTH_REGISTER: "/api/oauth/register",
  },

  WELL_KNOWN: {
    OAUTH_PROTECTED_RESOURCE: "/.well-known/oauth-protected-resource",
    OAUTH_AUTHORIZATION_SERVER: "/.well-known/oauth-authorization-server",
  },
} as const;

export type Routes = typeof ROUTES;

/**
 * Routes requiring authentication.
 * Proxy/middleware redirects unauthenticated users to sign-in.
 */
export const PROTECTED_ROUTES = [
  ROUTES.ADMIN.ADMIN,
  ROUTES.SAVED_CARS,
  ROUTES.RESERVATIONS,
  ROUTES.AUTH.OAUTH_CONSENT,
] as const;
