/**
 * Branding logo source fields.
 *
 * Describes the current logo asset reference and version for a branding record.
 */
export interface BrandingLogoSource {
  /**
   * URL of the current branding logo.
   */
  logoUrl?: string | null;
  /**
   * Version identifier for the current branding logo.
   */
  logoVersion?: string | null;
}
