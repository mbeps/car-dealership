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
  type LogoExtension,
  type LogoUploadPayload,
} from "@/schemas/logo-upload";

interface ParsedDataUrl {
  mimeType: string;
  bytes: Buffer;
}

interface RasterDimensions {
  width: number;
  height: number;
}

export interface ValidatedLogoUpload {
  bytes: Buffer;
  extension: LogoExtension;
  mimeType: string;
  sizeBytes: number;
  dimensions: RasterDimensions | null;
}

function getMaxBytesForExtension(extension: LogoExtension): number {
  if (extension === "png" || extension === "jpg" || extension === "jpeg") {
    return MAX_BYTES_PNG_JPEG;
  }

  if (extension === "ico") {
    return MAX_BYTES_ICO;
  }

  return MAX_BYTES_SVG;
}

export function parseDataUrl(dataUrl: string): ParsedDataUrl {
  const match = /^data:([^;]+);base64,([\s\S]+)$/i.exec(dataUrl.trim());
  if (!match) {
    throw new Error("Invalid file payload. Expected a base64 data URL.");
  }

  const mimeType = normaliseLogoMimeType(match[1]);
  const base64Payload = match[2].replace(/\s/g, "");

  if (!base64Payload) {
    throw new Error("File payload is empty.");
  }

  const bytes = Buffer.from(base64Payload, "base64");
  if (bytes.length === 0) {
    throw new Error("File payload could not be decoded.");
  }

  const normalisedInput = base64Payload.replace(/=+$/g, "");
  const normalisedDecoded = bytes.toString("base64").replace(/=+$/g, "");
  if (normalisedInput !== normalisedDecoded) {
    throw new Error("File payload is not valid base64.");
  }

  return { mimeType, bytes };
}

export function validateMagicBytes(
  bytes: Buffer,
  extension: LogoExtension,
): void {
  if (extension === "png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const isValid = signature.every((value, index) => bytes[index] === value);

    if (!isValid) {
      throw new Error("PNG signature check failed.");
    }

    return;
  }

  if (extension === "jpg" || extension === "jpeg") {
    const hasJpegStart = bytes[0] === 0xff && bytes[1] === 0xd8;
    if (!hasJpegStart) {
      throw new Error("JPEG signature check failed.");
    }

    return;
  }

  if (extension === "ico") {
    const hasIcoHeader =
      bytes.length >= 4 &&
      bytes[0] === 0x00 &&
      bytes[1] === 0x00 &&
      bytes[2] === 0x01 &&
      bytes[3] === 0x00;

    if (!hasIcoHeader) {
      throw new Error("ICO signature check failed.");
    }
  }
}

function extractPngDimensions(bytes: Buffer): RasterDimensions {
  if (bytes.length < 24) {
    throw new Error("PNG file is too small to contain dimensions.");
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);

  return { width, height };
}

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

export function extractRasterDimensions(
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

export function validateRasterDimensions(dimensions: RasterDimensions): void {
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

export function validateSvgSafeguards(bytes: Buffer): void {
  const content = bytes.toString("utf8");
  if (!content) {
    throw new Error("SVG content is empty.");
  }

  if (content.includes("\u0000")) {
    throw new Error("SVG contains invalid binary content.");
  }

  if (!/<svg[\s>]/i.test(content)) {
    throw new Error("SVG root element is missing.");
  }

  const blockedPatterns = [
    /<script[\s>]/i,
    /on[a-z]+\s*=/i,
    /javascript:/i,
    /<foreignObject[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      throw new Error("SVG contains blocked content.");
    }
  }
}

export function buildVersionedLogoPath(
  dealershipId: string,
  logoVersion: string,
  extension: LogoExtension,
): string {
  return `dealership/${dealershipId}/logo-${logoVersion}.${extension}`;
}

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
