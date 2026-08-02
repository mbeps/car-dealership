import type { LogoExtension } from "@/schemas/logo-upload";

export function buildVersionedLogoPath(
  dealershipId: string,
  logoVersion: string,
  extension: LogoExtension,
): string {
  return `dealership/${dealershipId}/logo-${logoVersion}.${extension}`;
}
