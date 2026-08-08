import * as z from "zod";
import { FILE_LIMITS } from "@/lib/env";

/**
 * File extensions accepted for dealership logo uploads.
 * Includes raster, favicon, and SVG logo formats used by branding assets.
 */
export type LogoExtension = "png" | "jpg" | "jpeg" | "ico" | "svg";

/**
 * Maximum logo image byte size used by the branding asset upload pipeline.
 * Read from FILE_LIMITS to keep logo and car image limits aligned.
 */
export const MAX_BYTES_PNG_JPEG = FILE_LIMITS.LOGO;
/**
 * Maximum favicon byte size used by the branding asset upload pipeline.
 * Read from FILE_LIMITS to keep logo and car image limits aligned.
 */
export const MAX_BYTES_ICO = FILE_LIMITS.FAVICON;
/**
 * Maximum SVG byte size used by the branding asset upload pipeline.
 * Read from FILE_LIMITS to keep logo and car image limits aligned.
 */
export const MAX_BYTES_SVG = FILE_LIMITS.FAVICON;
/**
 * Minimum accepted logo dimension in pixels.
 * Prevents tiny branding assets from being published.
 */
export const MIN_DIMENSION_PX = 64;
/**
 * Maximum accepted logo dimension in pixels.
 * Controls client-side image processing and storage size.
 */
export const MAX_DIMENSION_PX = 2048;
/**
 * Minimum accepted logo aspect ratio.
 * Rejects excessively narrow branding assets before image processing.
 */
export const MIN_ASPECT_RATIO = 0.2;
/**
 * Maximum accepted logo aspect ratio.
 * Rejects excessively wide branding assets before image processing.
 */
export const MAX_ASPECT_RATIO = 8;

/**
 * Allowed logo extensions in canonical order.
 * Used by form validation and upload helpers to keep accepted file types consistent.
 */
export const LOGO_ALLOWED_EXTENSIONS: readonly LogoExtension[] = [
  "png",
  "jpg",
  "jpeg",
  "ico",
  "svg",
];

/**
 * MIME types accepted for each logo extension.
 * Keeps extension validation aligned with server-side MIME checks.
 */
export const LOGO_MIME_BY_EXTENSION: Record<LogoExtension, readonly string[]> =
  {
    png: ["image/png"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    ico: ["image/vnd.microsoft.icon", "image/x-icon"],
    svg: ["image/svg+xml"],
  };

/**
 * Validates browser-generated logo upload payloads.
 * Keeps file name, MIME type, and data URL together before image validation.
 */
export const logoUploadPayloadSchema = z.object({
  name: z.string().min(1, "File name is required"),
  type: z.string().trim().optional().default(""),
  dataUrl: z.string().min(1, "File data is required"),
});

/**
 * Parsed logo upload payload produced by `logoUploadPayloadSchema`.
 * Used by logo upload forms and helpers that prepare branding assets.
 */
export type LogoUploadPayload = z.infer<typeof logoUploadPayloadSchema>;

/**
 * Normalises MIME type strings before comparison.
 * Used to make logo upload validation tolerant of browser casing and whitespace differences.
 *
 * @param mimeType - MIME type from file metadata or form data
 * @returns MIME type trimmed and lowercased
 */
export function normaliseLogoMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

/**
 * Extracts a known logo extension from a file name.
 * Returns null when the extension is absent or not allowed.
 *
 * @param fileName - File name from the uploaded logo
 * @returns Supported logo extension, or null
 */
export function getLogoExtensionFromFileName(
  fileName: string,
): LogoExtension | null {
  const extension = fileName.trim().toLowerCase().split(".").pop();
  if (!extension || !isLogoExtension(extension)) {
    return null;
  }

  return extension;
}

/**
 * Checks whether a MIME type is allowed for any logo extension.
 * Used during upload validation before file bytes are processed.
 *
 * @param mimeType - MIME type from the uploaded file
 * @returns True when the MIME type is supported
 */
export function isAllowedLogoMimeType(mimeType: string): boolean {
  const normalisedMimeType = normaliseLogoMimeType(mimeType);

  return Object.values(LOGO_MIME_BY_EXTENSION).some((mimes) =>
    mimes.includes(normalisedMimeType),
  );
}

/**
 * Validates that a logo extension matches its MIME type.
 * Prevents mismatches such as SVG files with raster MIME types.
 *
 * @param extension - Parsed logo extension
 * @param mimeType - MIME type from the uploaded file
 * @returns True when extension and MIME type are compatible
 */
export function isCompatibleLogoExtensionAndMimeType(
  extension: LogoExtension,
  mimeType: string,
): boolean {
  const normalisedMimeType = normaliseLogoMimeType(mimeType);

  return LOGO_MIME_BY_EXTENSION[extension].includes(normalisedMimeType);
}

/**
 * Infers the primary MIME type from a file extension.
 * Used as a safe fallback when browser MIME metadata is unavailable or too broad.
 *
 * @param fileName - File name from the uploaded logo
 * @returns Expected MIME type for the extension, or null
 */
export function getMimeTypeFromFileName(fileName: string): string | null {
  const extension = getLogoExtensionFromFileName(fileName);
  if (!extension) {
    return null;
  }

  return LOGO_MIME_BY_EXTENSION[extension][0] ?? null;
}

/**
 * Checks whether a file extension is in the accepted logo extension list.
 * Used by filename parsing helpers to keep extension validation local.
 *
 * @param value - File extension to check
 * @returns True when extension is supported
 */
function isLogoExtension(value: string): value is LogoExtension {
  return (
    value === "png" ||
    value === "jpg" ||
    value === "jpeg" ||
    value === "ico" ||
    value === "svg"
  );
}
