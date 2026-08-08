import type { LogoExtension, LogoUploadPayload } from "@/schemas/logo-upload";
import {
  MAX_ASPECT_RATIO,
  MAX_BYTES_ICO,
  MAX_BYTES_PNG_JPEG,
  MAX_BYTES_SVG,
  MAX_DIMENSION_PX,
  MIN_ASPECT_RATIO,
  MIN_DIMENSION_PX,
  getLogoExtensionFromFileName,
  isAllowedLogoMimeType,
  isCompatibleLogoExtensionAndMimeType,
  logoUploadPayloadSchema,
  normaliseLogoMimeType,
} from "@/schemas/logo-upload";
import type { RasterDimensions } from "@/types/logo/raster-dimensions";
import { parseDataUrl } from "@/lib/helpers/parse-data-url";
import { validateMagicBytes } from "@/lib/helpers/validate-magic-bytes";
import { validateSvgSafeguards } from "@/lib/helpers/validate-svg-safeguards";
import type { ValidatedLogoUpload } from "@/types/logo/validated-logo-upload";

/**
 * Returns the maximum allowed logo size for a file extension.
 *
 * Keeps size limits in one place so schema validation and byte checks use the same constraints.
 *
 * @param extension - Logo extension to check.
 * @returns Maximum allowed bytes for the extension.
 */
function getMaxBytesForExtension(extension: LogoExtension): number {
  if (extension === "png" || extension === "jpg" || extension === "jpeg") {
    return MAX_BYTES_PNG_JPEG;
  }

  if (extension === "ico") {
    return MAX_BYTES_ICO;
  }

  return MAX_BYTES_SVG;
}

/**
 * Extracts PNG dimensions from raw logo bytes.
 *
 * @throws {Error} When the PNG payload is too small to contain valid dimensions.
 */
function extractPngDimensions(bytes: Buffer): RasterDimensions {
  if (bytes.length < 24) {
    throw new Error("PNG file is too small to contain dimensions.");
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);

  return { width, height };
}

/**
 * Extracts JPEG dimensions from raw logo bytes.
 *
 * @throws {Error} When the JPEG header is invalid or dimensions cannot be found.
 */
function extractJpegDimensions(bytes: Buffer): RasterDimensions {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("JPEG header is invalid.");
  }

  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      break;
    }

    const isSofMarker =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSofMarker) {
      if (offset + 7 > bytes.length) {
        break;
      }

      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);

      return { width, height };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions could not be determined.");
}

/**
 * Extracts ICO dimensions from raw logo bytes.
 *
 * @throws {Error} When the ICO payload is too small or contains no images.
 */
function extractIcoDimensions(bytes: Buffer): RasterDimensions {
  if (bytes.length < 8) {
    throw new Error("ICO file is too small to contain dimensions.");
  }

  const imageCount = bytes.readUInt16LE(4);
  if (imageCount < 1) {
    throw new Error("ICO file contains no images.");
  }

  const rawWidth = bytes[6];
  const rawHeight = bytes[7];

  return {
    width: rawWidth === 0 ? 256 : rawWidth,
    height: rawHeight === 0 ? 256 : rawHeight,
  };
}

/**
 * Extracts raster dimensions from logo bytes.
 *
 * Selects the decoder for PNG, JPEG, or ICO payloads before dimension validation runs.
 *
 * @param bytes - Raw logo bytes.
 * @param extension - Logo file extension used to choose the decoder.
 * @returns Image width and height in pixels.
 * @throws {Error} When the payload is not a supported raster logo or dimensions cannot be read.
 */
function extractRasterDimensions(
  bytes: Buffer,
  extension: LogoExtension,
): RasterDimensions {
  if (extension === "png") {
    return extractPngDimensions(bytes);
  }

  if (extension === "jpg" || extension === "jpeg") {
    return extractJpegDimensions(bytes);
  }

  return extractIcoDimensions(bytes);
}

/**
 * Validates logo raster dimensions against project limits.
 *
 * @throws {Error} When dimensions are too small, too large, or outside the allowed aspect ratio.
 */
function validateRasterDimensions(dimensions: RasterDimensions): void {
  const { width, height } = dimensions;

  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    throw new Error(
      `Image dimensions are too small. Minimum size is ${MIN_DIMENSION_PX}px.`,
    );
  }

  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    throw new Error(
      `Image dimensions are too large. Maximum size is ${MAX_DIMENSION_PX}px.`,
    );
  }

  const aspectRatio = width / height;
  if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
    throw new Error("Image aspect ratio is outside allowed limits.");
  }
}

/**
 * Validates a logo upload payload and prepares it for storage.
 *
 * Applies schema validation, MIME and extension checks, byte limits, raster dimensions, and SVG safeguards before returning bytes ready for persistence.
 *
 * @param payload - Raw logo upload form data.
 * @returns Validated logo upload data with bytes, metadata, and dimensions.
 * @throws {Error} When the payload is malformed, unsupported, too large, invalid dimensions, or unsafe SVG content.
 * @see validateMagicBytes for raster signature validation
 * @see validateSvgSafeguards for SVG content restrictions
 */
export function validateAndPrepareLogoUpload(
  payload: LogoUploadPayload,
): ValidatedLogoUpload {
  const input = logoUploadPayloadSchema.parse(payload);

  const extension = getLogoExtensionFromFileName(input.name);
  if (!extension) {
    throw new Error(
      "Unsupported file extension. Use png, jpg, jpeg, ico or svg.",
    );
  }

  const parsedData = parseDataUrl(input.dataUrl);
  const declaredMimeType = normaliseLogoMimeType(input.type || "");

  if (declaredMimeType && !isAllowedLogoMimeType(declaredMimeType)) {
    throw new Error("Unsupported file MIME type.");
  }

  if (!isAllowedLogoMimeType(parsedData.mimeType)) {
    throw new Error("Unsupported file MIME type.");
  }

  if (
    declaredMimeType &&
    !isCompatibleLogoExtensionAndMimeType(extension, declaredMimeType)
  ) {
    throw new Error("File extension does not match declared MIME type.");
  }

  if (!isCompatibleLogoExtensionAndMimeType(extension, parsedData.mimeType)) {
    throw new Error("File extension does not match file payload MIME type.");
  }

  const maxBytes = getMaxBytesForExtension(extension);
  if (parsedData.bytes.length > maxBytes) {
    throw new Error(`File is too large. Maximum allowed is ${maxBytes} bytes.`);
  }

  let dimensions: RasterDimensions | null = null;

  if (extension === "svg") {
    validateSvgSafeguards(parsedData.bytes);
  } else {
    validateMagicBytes(parsedData.bytes, extension);
    dimensions = extractRasterDimensions(parsedData.bytes, extension);
    validateRasterDimensions(dimensions);
  }

  return {
    bytes: parsedData.bytes,
    extension,
    mimeType: parsedData.mimeType,
    sizeBytes: parsedData.bytes.length,
    dimensions,
  };
}
