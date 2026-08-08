/**
 * Car color entity.
 * Represents a normalised color option used across car listings and selects.
 */
export interface CarColor {
  /** Unique database identifier. */
  id: string;
  /** Human-readable color name.
   */
  name: string;
  /** URL-safe color slug.
   */
  slug: string;
  /** Creation timestamp.
   */
  createdAt: Date | string;
  /** Last update timestamp.
   */
  updatedAt: Date | string;
}
