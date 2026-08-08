import type { LogoExtension } from "@/schemas/logo-upload";

/**
 * Builds the public logo path with the asset version baked into the filename.
 *
 * The versioned filename works with Next.js image optimization and Supabase storage paths for dealership branding assets.
 *
 * @param dealershipId - Dealership identifier that scopes the logo path.
 * @param logoVersion - Asset version to include in the filename.
 * @param extension - File extension for the logo.
 * @returns Versioned dealership logo path.
 */
export function buildVersionedLogoPath(
  dealershipId: string,
  logoVersion: string,
  extension: LogoExtension,
): string {
  return `dealership/${dealershipId}/logo-${logoVersion}.${extension}`;
}
