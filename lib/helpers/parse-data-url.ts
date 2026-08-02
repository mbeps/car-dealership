import { normaliseLogoMimeType } from "@/schemas/logo-upload";
import type { ParsedLogoDataUrl } from "@/types/logo/parsed-logo-data-url";

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
