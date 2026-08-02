import type { LogoExtension } from "@/schemas/logo-upload";
import type { RasterDimensions } from "@/types/logo/raster-dimensions";

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
