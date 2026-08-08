/**
 * Parsed base64 logo payload.
 * Stores the decoded MIME type and raw bytes before logo validation.
 */
export interface ParsedLogoDataUrl {
  /** MIME type decoded from the data URL. */
  mimeType: string;
  /** Decoded base64 logo bytes ready for validation. */
  bytes: Buffer;
}
