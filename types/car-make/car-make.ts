/**
 * Car make entity.
 * Represents a normalised make option used across car listings and selects.
 */
export interface CarMake {
  /** Unique database identifier. */
  id: string;
  /** Human-readable make name.
   */
  name: string;
  /** URL-safe make slug.
   */
  slug: string;
  /** Optional country associated with the make.
   */
  country: string | null;
  /** Creation timestamp.
   */
  createdAt: Date | string;
  /** Last update timestamp.
   */
  updatedAt: Date | string;
}
