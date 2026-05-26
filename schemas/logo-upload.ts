import * as z from "zod";

export type LogoExtension = "png" | "jpg" | "jpeg" | "ico" | "svg";

export const MAX_BYTES_PNG_JPEG = 1_048_576;
export const MAX_BYTES_ICO = 262_144;
export const MAX_BYTES_SVG = 262_144;
export const MIN_DIMENSION_PX = 64;
export const MAX_DIMENSION_PX = 2048;
export const MIN_ASPECT_RATIO = 0.2;
export const MAX_ASPECT_RATIO = 8;

export const LOGO_ALLOWED_EXTENSIONS: readonly LogoExtension[] = [
  "png",
  "jpg",
  "jpeg",
  "ico",
  "svg",
];

export const LOGO_MIME_BY_EXTENSION: Record<LogoExtension, readonly string[]> =
  {
    png: ["image/png"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    ico: ["image/vnd.microsoft.icon", "image/x-icon"],
    svg: ["image/svg+xml"],
  };

export const logoUploadPayloadSchema = z.object({
  name: z.string().min(1, "File name is required"),
  type: z.string().trim().optional().default(""),
  dataUrl: z.string().min(1, "File data is required"),
});

export type LogoUploadPayload = z.infer<typeof logoUploadPayloadSchema>;

export function normaliseLogoMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

export function getLogoExtensionFromFileName(
  fileName: string,
): LogoExtension | null {
  const extension = fileName.trim().toLowerCase().split(".").pop();
  if (!extension || !isLogoExtension(extension)) {
    return null;
  }

  return extension;
}

export function isAllowedLogoMimeType(mimeType: string): boolean {
  const normalisedMimeType = normaliseLogoMimeType(mimeType);

  return Object.values(LOGO_MIME_BY_EXTENSION).some((mimes) =>
    mimes.includes(normalisedMimeType),
  );
}

export function isCompatibleLogoExtensionAndMimeType(
  extension: LogoExtension,
  mimeType: string,
): boolean {
  const normalisedMimeType = normaliseLogoMimeType(mimeType);

  return LOGO_MIME_BY_EXTENSION[extension].includes(normalisedMimeType);
}

export function getMimeTypeFromFileName(fileName: string): string | null {
  const extension = getLogoExtensionFromFileName(fileName);
  if (!extension) {
    return null;
  }

  return LOGO_MIME_BY_EXTENSION[extension][0] ?? null;
}

function isLogoExtension(value: string): value is LogoExtension {
  return (
    value === "png" ||
    value === "jpg" ||
    value === "jpeg" ||
    value === "ico" ||
    value === "svg"
  );
}
