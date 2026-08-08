import { CarColor } from "./car-color";

/**
 * Car color option for dropdowns/selects.
 * Omits timestamps so UI controls only receive display and routing fields.
 */
export type CarColorOption = Pick<CarColor, "id" | "name" | "slug">;
