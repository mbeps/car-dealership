import { ROUTES } from "@/constants/routes";

/**
 * Builds the sign-in URL with a safe return path parameter.
 *
 * Use this for auth-protected navigation so users can return to their original page after signing in.
 *
 * @param redirectPath - Path to return to after sign-in completes.
 * @returns Sign-in URL with the encoded return path.
 */
export function createSignInRedirect(redirectPath: string): string {
  return `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(redirectPath)}`;
}
