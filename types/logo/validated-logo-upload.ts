import type { RasterDimensions } from "@/types/logo/raster-dimensions";
import type { LogoExtension } from "@/schemas/logo-upload";

export interface ValidatedLogoUpload {
  bytes: Buffer;
  extension: LogoExtension;
  mimeType: string;
  sizeBytes: number;
  dimensions: RasterDimensions | null;
}
