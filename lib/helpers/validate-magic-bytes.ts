import type { LogoExtension } from "@/schemas/logo-upload";

/**
 * Validates raster logo files by checking their magic byte signatures.
 *
 * Ensures PNG, JPEG, and ICO payloads start with the expected binary headers before dimensions are decoded.
 *
 * @param bytes - Raw logo bytes.
 * @param extension - Logo file extension used to choose the signature check.
 * @throws {Error} When the payload does not match the expected raster logo signature.
 */
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
