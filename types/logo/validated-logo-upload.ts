import type { LogoExtension } from "@/schemas/logo-upload";
import type { RasterDimensions } from "@/types/logo/raster-dimensions";

/**
 * Logo upload data after validation and preparation.
 * Contains the bytes and metadata needed before persistence in storage.
 */
export interface ValidatedLogoUpload {
  /** Raw logo bytes accepted for persistence. */
  bytes: Buffer;
  /** Canonical file extension for the logo. */
  extension: LogoExtension;
  /** Normalised MIME type matching the extension and payload. */
  mimeType: string;
  /** Exact byte length after data URL decoding. */
  sizeBytes: number;
  /** Image dimensions for raster logos, or null for SVG logos. */
  dimensions: RasterDimensions | null;
}
