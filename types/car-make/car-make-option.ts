import { CarMake } from "./car-make";

/**
 * Car make option for dropdowns/selects
 */
export type CarMakeOption = Pick<CarMake, "id" | "name" | "slug"> & {
  country?: string | null;
};
