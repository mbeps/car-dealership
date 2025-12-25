/**
 * Car make entity
 */
export interface CarMake {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
