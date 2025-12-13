import { EntityManager, Brackets } from "typeorm";
import { Car } from "../entities/car.entity";
import { CarMake } from "../entities/car-make.entity";
import { CarColor } from "../entities/car-color.entity";
import { UserSavedCar } from "../entities/user-saved-car.entity";
import { TestDriveBooking } from "../entities/test-drive-booking.entity";
import { DealershipInfo } from "../entities/dealership-info.entity";
import { User } from "../entities/user.entity";
import {
  CarFiltersData,
  CarFilters,
  PaginationInfo,
  SerializedCar,
  UserTestDrive,
  SerializedDealershipInfo,
  CarStatusEnum,
} from "@/types";
import { serializeCarData } from "@/lib/helpers";

export class UserCarService {
  constructor(private manager: EntityManager) {}

  /**
   * Computes available filter options from current inventory.
   */
  async getCarFilters(): Promise<CarFiltersData> {
    const qb = this.manager.createQueryBuilder(Car, "car");
    qb.where("car.status = :status", { status: CarStatusEnum.AVAILABLE });
    qb.leftJoinAndSelect("car.carMake", "carMake");
    qb.leftJoinAndSelect("car.carColor", "carColor");

    const cars = await qb.getMany();

    // Aggregations
    const prices = cars.map((c) => Number(c.price));
    const mileages = cars.map((c) => c.mileage);
    const currentYear = new Date().getFullYear();
    const ages = cars.map((c) => currentYear - c.year);

    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 100000;
    const minMileage = mileages.length ? Math.min(...mileages) : 0;
    const maxMileage = mileages.length ? Math.max(...mileages) : 200000;
    const minAge = ages.length ? Math.min(...ages) : 0;
    const maxAge = ages.length ? Math.max(...ages) : 20;

    // Unique Lists
    const uniqueMakesMap = new Map<string, any>();
    const uniqueColorsMap = new Map<string, any>();
    const bodyTypes = new Set<string>();
    const fuelTypes = new Set<string>();
    const transmissions = new Set<string>();

    cars.forEach((car) => {
      if (car.carMake) {
        uniqueMakesMap.set(car.carMake.id, {
          id: car.carMake.id,
          name: car.carMake.name,
          slug: car.carMake.slug,
          country: car.carMake.country,
        });
      }
      if (car.carColor) {
        uniqueColorsMap.set(car.carColor.id, {
          id: car.carColor.id,
          name: car.carColor.name,
          slug: car.carColor.slug,
        });
      }
      if (car.bodyType) bodyTypes.add(car.bodyType);
      if (car.fuelType) fuelTypes.add(car.fuelType);
      if (car.transmission) transmissions.add(car.transmission);
    });

    return {
      makes: Array.from(uniqueMakesMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      colors: Array.from(uniqueColorsMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      bodyTypes: Array.from(bodyTypes).sort(),
      fuelTypes: Array.from(fuelTypes).sort(),
      transmissions: Array.from(transmissions).sort(),
      priceRange: { min: minPrice, max: maxPrice },
      mileageRange: { min: minMileage, max: maxMileage },
      ageRange: { min: minAge, max: maxAge },
    };
  }

  /**
   * Main inventory query with filtering, sorting, and pagination.
   */
  async getCars(
    filters: CarFilters,
    userId?: string
  ): Promise<{ cars: SerializedCar[]; pagination: PaginationInfo }> {
    const {
      search = "",
      make = "",
      color = "",
      bodyType = "",
      fuelType = "",
      transmission = "",
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      minMileage = 0,
      maxMileage = Number.MAX_SAFE_INTEGER,
      minAge = 0,
      maxAge = Number.MAX_SAFE_INTEGER,
      sortBy = "newest",
      page = 1,
      limit = 6,
    } = filters;

    const qb = this.manager.createQueryBuilder(Car, "car");
    qb.leftJoinAndSelect("car.carMake", "carMake");
    qb.leftJoinAndSelect("car.carColor", "carColor");
    qb.where("car.status = :status", { status: CarStatusEnum.AVAILABLE });

    // Resolve slugs to IDs if needed
    if (make) {
      const makeEntity = await this.manager.findOne(CarMake, {
        where: { slug: make },
      });
      if (makeEntity) {
        qb.andWhere("car.carMakeId = :makeId", { makeId: makeEntity.id });
      } else {
        // If make slug not found, return empty
        return {
          cars: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }
    }

    if (color) {
      const colorEntity = await this.manager.findOne(CarColor, {
        where: { slug: color },
      });
      if (colorEntity) {
        qb.andWhere("car.carColorId = :colorId", { colorId: colorEntity.id });
      } else {
        return {
          cars: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }
    }

    // Search
    if (search) {
      qb.andWhere(
        new Brackets((sqb) => {
          sqb.where("car.model ILIKE :search", { search: `%${search}%` });
          sqb.orWhere("car.description ILIKE :search", {
            search: `%${search}%`,
          });
          sqb.orWhere("car.bodyType ILIKE :search", { search: `%${search}%` });
          sqb.orWhere("car.numberPlate ILIKE :search", {
            search: `%${search}%`,
          });
          sqb.orWhere("carMake.name ILIKE :search", { search: `%${search}%` });
          sqb.orWhere("carColor.name ILIKE :search", { search: `%${search}%` });
        })
      );
    }

    // Other filters
    if (bodyType) qb.andWhere("car.bodyType ILIKE :bodyType", { bodyType });
    if (fuelType) qb.andWhere("car.fuelType ILIKE :fuelType", { fuelType });
    if (transmission)
      qb.andWhere("car.transmission ILIKE :transmission", { transmission });

    // Ranges
    qb.andWhere("car.price >= :minPrice", { minPrice });
    if (maxPrice && maxPrice < Number.MAX_SAFE_INTEGER) {
      qb.andWhere("car.price <= :maxPrice", { maxPrice });
    }

    qb.andWhere("car.mileage >= :minMileage", { minMileage });
    if (maxMileage && maxMileage < Number.MAX_SAFE_INTEGER) {
      qb.andWhere("car.mileage <= :maxMileage", { maxMileage });
    }

    // Age (Year)
    if (minAge > 0 || maxAge < Number.MAX_SAFE_INTEGER) {
      const currentYear = new Date().getFullYear();
      const maxYear = currentYear - minAge;
      const minYear =
        maxAge < Number.MAX_SAFE_INTEGER ? currentYear - maxAge : 0;

      qb.andWhere("car.year <= :maxYear", { maxYear });
      if (minYear > 0) {
        qb.andWhere("car.year >= :minYear", { minYear });
      }
    }

    // Sorting
    switch (sortBy) {
      case "priceAsc":
        qb.orderBy("car.price", "ASC");
        break;
      case "priceDesc":
        qb.orderBy("car.price", "DESC");
        break;
      case "newest":
      default:
        qb.orderBy("car.createdAt", "DESC");
        break;
    }

    // Pagination
    const total = await qb.getCount();
    qb.skip((page - 1) * limit).take(limit);

    const cars = await qb.getMany();

    // Wishlist status
    let wishlisted = new Set<string>();
    if (userId) {
      // We need to find the DB user ID first, because UserSavedCar uses the internal ID
      const user = await this.manager.findOne(User, {
        where: { supabaseAuthUserId: userId },
      });

      if (user) {
        const savedCars = await this.manager.find(UserSavedCar, {
          where: { userId: user.id },
          select: ["carId"],
        });
        savedCars.forEach((sc) => wishlisted.add(sc.carId));
      }
    }

    const serializedCars = cars.map((car) =>
      serializeCarData(car, wishlisted.has(car.id))
    );

    return {
      cars: serializedCars,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches car details with test drive metadata.
   */
  async getCarById(
    carId: string,
    userId?: string
  ): Promise<
    | (SerializedCar & {
        testDriveInfo: {
          userTestDrive: UserTestDrive | null;
          dealership: SerializedDealershipInfo | null;
          existingBookings: Array<{
            date: string;
            startTime: string;
            endTime: string;
          }>;
        };
      })
    | null
  > {
    const car = await this.manager.findOne(Car, {
      where: { id: carId },
      relations: ["carMake", "carColor"],
    });

    if (!car) return null;

    let isWishlisted = false;
    let userTestDrive: UserTestDrive | null = null;

    if (userId) {
      const user = await this.manager.findOne(User, {
        where: { supabaseAuthUserId: userId },
      });

      if (user) {
        const saved = await this.manager.findOne(UserSavedCar, {
          where: { userId: user.id, carId },
        });
        isWishlisted = !!saved;

        const booking = await this.manager.findOne(TestDriveBooking, {
          where: { userId: user.id, carId },
          order: { createdAt: "DESC" },
        });

        if (
          booking &&
          ["PENDING", "CONFIRMED", "COMPLETED"].includes(booking.status)
        ) {
          userTestDrive = {
            id: booking.id,
            status: booking.status,
            bookingDate:
              booking.bookingDate instanceof Date
                ? booking.bookingDate.toISOString().split("T")[0]
                : (booking.bookingDate as unknown as string),
          };
        }
      }
    }

    const dealership = await this.manager.findOne(DealershipInfo, {
      relations: ["workingHours"],
    });

    const existingBookings = await this.manager
      .createQueryBuilder(TestDriveBooking, "booking")
      .select(["booking.bookingDate", "booking.startTime", "booking.endTime"])
      .where("booking.carId = :carId", { carId })
      .andWhere("booking.status IN (:...statuses)", {
        statuses: ["PENDING", "CONFIRMED"],
      })
      .andWhere("booking.bookingDate >= :today", {
        today: new Date().toISOString().split("T")[0],
      })
      .getMany();

    return {
      ...serializeCarData(car, isWishlisted),
      testDriveInfo: {
        userTestDrive,
        dealership: dealership as SerializedDealershipInfo | null,
        existingBookings: existingBookings.map((b) => ({
          date:
            b.bookingDate instanceof Date
              ? b.bookingDate.toISOString().split("T")[0]
              : (b.bookingDate as unknown as string),
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      },
    };
  }

  /**
   * Toggles car in user's wishlist.
   */
  async toggleSavedCar(
    carId: string,
    userId: string
  ): Promise<{ saved: boolean; message: string }> {
    // Ensure user exists
    let user = await this.manager.findOne(User, {
      where: { supabaseAuthUserId: userId },
    });

    if (!user) {
      // This should ideally be handled by a separate "ensure user" step,
      // but for safety we can throw or try to create (if we had profile data).
      // Since we don't have profile data here, we assume the caller ensures it.
      throw new Error("User profile not found");
    }

    const car = await this.manager.findOne(Car, { where: { id: carId } });
    if (!car) throw new Error("Car not found");

    const existing = await this.manager.findOne(UserSavedCar, {
      where: { userId: user.id, carId },
    });

    if (existing) {
      await this.manager.remove(existing);
      return { saved: false, message: "Car removed from favorites" };
    } else {
      const saved = new UserSavedCar();
      saved.userId = user.id;
      saved.carId = carId;
      await this.manager.save(saved);
      return { saved: true, message: "Car added to favorites" };
    }
  }

  /**
   * Retrieves user's wishlist.
   */
  async getSavedCars(userId: string): Promise<SerializedCar[]> {
    const user = await this.manager.findOne(User, {
      where: { supabaseAuthUserId: userId },
    });

    if (!user) return [];

    const savedCars = await this.manager.find(UserSavedCar, {
      where: { userId: user.id },
      relations: ["car", "car.carMake", "car.carColor"],
      order: { savedAt: "DESC" },
    });

    return savedCars.map((s) => serializeCarData(s.car));
  }

  /**
   * Gets featured cars (for homepage).
   */
  async getFeaturedCars(limit: number = 6): Promise<SerializedCar[]> {
    const cars = await this.manager.find(Car, {
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
   * Gets all makes for dropdowns/filters.
   */
  async getAllMakes(): Promise<CarMake[]> {
    return await this.manager.find(CarMake, { order: { name: "ASC" } });
  }

  /**
   * Gets all colors for dropdowns/filters.
   */
  async getAllColors(): Promise<CarColor[]> {
    return await this.manager.find(CarColor, { order: { name: "ASC" } });
  }
}
