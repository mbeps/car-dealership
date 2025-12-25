import { CarColor } from "./car-color";

/**
 * Car color option for dropdowns/selects
 */
export type CarColorOption = Pick<CarColor, "id" | "name" | "slug">;
