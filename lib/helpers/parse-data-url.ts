import { normaliseLogoMimeType } from "@/schemas/logo-upload";
import type { ParsedLogoDataUrl } from "@/types/logo/parsed-logo-data-url";

/**
 * Parses and validates a base64 logo data URL.
 *
 * Normalises the MIME type and verifies the payload decodes to non-empty base64 bytes before returning it for logo validation.
 *
 * @param dataUrl - Base64 data URL from the logo upload form.
 * @returns Parsed MIME type and decoded bytes.
 * @throws {Error} When the data URL is malformed, empty, or invalid base64.
 */
export function parseDataUrl(dataUrl: string): ParsedLogoDataUrl {
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
