/**
 * Admin car service for database operations.
 */

import { Like, ILike, In, Between, FindOptionsWhere } from "typeorm";
import {
  getCarRepository,
  getCarMakeRepository,
  getCarColorRepository,
  getUserRepository,
  getDealershipInfoRepository,
  getWorkingHourRepository,
  getTestDriveBookingRepository,
  getUserSavedCarRepository,
} from "@/db/repositories";
import { Car, CarMake, CarColor } from "@/db/entities";
import { serializeCarData } from "@/lib/helpers";
import { SerializedCar, CarFilters, CarStatusEnum } from "@/types";

/**
 * Admin car service - uses TypeORM for complex queries and transactions.
 */
export class AdminCarService {
  /**
   * Searches cars with optional filters.
   * Used in admin dashboard for car management.
   */
  static async searchCars(search?: string): Promise<SerializedCar[]> {
    const carRepo = await getCarRepository();

    const where: FindOptionsWhere<Car> | FindOptionsWhere<Car>[] = [];

    if (search && search.trim()) {
      const searchTerm = search.trim();

      // Search in multiple fields
      where.push(
        { model: ILike(`%${searchTerm}%`) },
        { description: ILike(`%${searchTerm}%`) },
        { numberPlate: ILike(`%${searchTerm}%`) }
      );

      // Also search in related make/color names
      const makeRepo = await getCarMakeRepository();
      const colorRepo = await getCarColorRepository();

      const [matchingMakes, matchingColors] = await Promise.all([
        makeRepo.find({ where: { name: ILike(`%${searchTerm}%`) } }),
        colorRepo.find({ where: { name: ILike(`%${searchTerm}%`) } }),
      ]);

      if (matchingMakes.length > 0) {
        where.push({ carMakeId: In(matchingMakes.map((m) => m.id)) });
      }

      if (matchingColors.length > 0) {
        where.push({ carColorId: In(matchingColors.map((c) => c.id)) });
      }
    }

    const cars = await carRepo.find({
      where: where.length > 0 ? where : undefined,
      relations: ["carMake", "carColor"],
      order: { createdAt: "DESC" },
    });

    return cars.map((car) => serializeCarData(car));
  }

  /**
   * Gets a single car by ID with relations.
   */
  static async getCarById(id: string): Promise<Car | null> {
    const carRepo = await getCarRepository();
    return await carRepo.findOne({
      where: { id },
      relations: ["carMake", "carColor"],
    });
  }

  /**
   * Creates a new car record.
   */
  static async createCar(carData: Partial<Car>): Promise<Car> {
    const carRepo = await getCarRepository();
    const car = carRepo.create(carData);
    return await carRepo.save(car);
  }

  /**
   * Updates an existing car.
   */
  static async updateCar(
    id: string,
    updates: Partial<Car>
  ): Promise<Car | null> {
    const carRepo = await getCarRepository();
    await carRepo.update(id, updates);
    return await this.getCarById(id);
  }

  /**
   * Deletes a car by ID.
   */
  static async deleteCar(id: string): Promise<boolean> {
    const carRepo = await getCarRepository();
    const result = await carRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Updates car status (AVAILABLE, SOLD, UNAVAILABLE).
   */
  static async updateCarStatus(
    id: string,
    status: CarStatusEnum
  ): Promise<boolean> {
    const carRepo = await getCarRepository();
    const result = await carRepo.update(id, { status });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Toggles car featured status.
   */
  static async toggleFeatured(id: string, featured: boolean): Promise<boolean> {
    const carRepo = await getCarRepository();
    const result = await carRepo.update(id, { featured });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Gets all makes for dropdowns/filters.
   */
  static async getAllMakes(): Promise<CarMake[]> {
    const makeRepo = await getCarMakeRepository();
    return await makeRepo.find({ order: { name: "ASC" } });
  }

  /**
   * Gets all colors for dropdowns/filters.
   */
  static async getAllColors(): Promise<CarColor[]> {
    const colorRepo = await getCarColorRepository();
    return await colorRepo.find({ order: { name: "ASC" } });
  }

  /**
   * Gets a make by slug.
   */
  static async getMakeBySlug(slug: string): Promise<CarMake | null> {
    const makeRepo = await getCarMakeRepository();
    return await makeRepo.findOne({ where: { slug } });
  }

  /**
   * Gets a color by slug.
   */
  static async getColorBySlug(slug: string): Promise<CarColor | null> {
    const colorRepo = await getCarColorRepository();
    return await colorRepo.findOne({ where: { slug } });
  }

  /**
   * Checks if a number plate already exists.
   */
  static async numberPlateExists(
    numberPlate: string,
    excludeId?: string
  ): Promise<boolean> {
    const carRepo = await getCarRepository();
    const where: FindOptionsWhere<Car> = { numberPlate };

    const car = await carRepo.findOne({ where });

    if (!car) return false;
    if (excludeId && car.id === excludeId) return false;

    return true;
  }

  /**
   * Gets featured cars (for homepage).
   */
  static async getFeaturedCars(limit: number = 6): Promise<SerializedCar[]> {
    const carRepo = await getCarRepository();

    const cars = await carRepo.find({
      where: {
        featured: true,
        status: CarStatusEnum.AVAILABLE,
      },
      relations: ["carMake", "carColor"],
      order: { createdAt: "DESC" },
      take: limit,
    });

    return cars.map((car) => serializeCarData(car));
  }

  /**
   * Gets dashboard statistics for cars.
   */
  static async getStatistics(): Promise<{
    total: number;
    available: number;
    sold: number;
    unavailable: number;
    featured: number;
  }> {
    const carRepo = await getCarRepository();

    const [total, available, sold, unavailable, featured] = await Promise.all([
      carRepo.count(),
      carRepo.count({ where: { status: CarStatusEnum.AVAILABLE } }),
      carRepo.count({ where: { status: CarStatusEnum.SOLD } }),
      carRepo.count({ where: { status: CarStatusEnum.UNAVAILABLE } }),
      carRepo.count({ where: { featured: true } }),
    ]);

    return {
      total,
      available,
      sold,
      unavailable,
      featured,
    };
  }

  /**
   * Counts sold cars from a list of car IDs.
   * Used for test drive conversion rate calculations.
   */
  static async countSoldCars(carIds: string[]): Promise<number> {
    if (carIds.length === 0) return 0;

    const carRepo = await getCarRepository();
    return await carRepo.count({
      where: {
        id: In(carIds),
        status: CarStatusEnum.SOLD,
      },
    });
  }
}
