import { ROUTES } from "@/constants/routes";

/**
 * Builds sign-in URL with return path.
 *
 * @param redirectPath - Where to redirect after sign-in
 * @returns Sign-in URL with redirect param
 */
export function createSignInRedirect(redirectPath: string): string {
  return `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirectPath)}`;
}
