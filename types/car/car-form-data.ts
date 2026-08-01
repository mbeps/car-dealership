/**
 * Car form data used by car creation and edit server actions.
 */
export interface CarFormData {
  carMakeId: string;
  carColorId: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  numberPlate: string;
  seats?: number;
  description: string;
  status: string;
  featured: boolean;
  features: string[];
}
