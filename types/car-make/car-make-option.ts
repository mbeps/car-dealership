import type { CarMake } from "./car-make";

/**
 * Car make option for dropdowns/selects.
 * Omits timestamps so UI controls only receive display, routing, and country fields.
 */
export type CarMakeOption = Pick<CarMake, "id" | "name" | "slug"> & {
  /** Optional country associated with the make.
   */
  country?: string | null;
};
