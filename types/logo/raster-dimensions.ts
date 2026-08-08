/**
 * Pixel dimensions for a raster logo.
 * Used to enforce size and aspect-ratio limits before storing branding assets.
 */
export interface RasterDimensions {
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
}
