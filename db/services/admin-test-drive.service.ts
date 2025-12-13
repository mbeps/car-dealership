/**
 * Admin service for managing test drive bookings.
 */

import { Between, In, FindOptionsWhere, ILike, Brackets } from "typeorm";
import { getTestDriveBookingRepository } from "@/db/repositories";
import { TestDriveBooking } from "@/db/entities";
import { BookingStatusEnum } from "@/types";
import {
  validateId,
  validateBookingStatus,
  validateSearchParams,
} from "@/db/validation";

export class AdminTestDriveService {
  /**
   * Gets all test drive bookings with optional filters.
   */
  static async getBookings(filters?: {
    status?: BookingStatusEnum;
    search?: string;
  }): Promise<TestDriveBooking[]> {
    const bookingRepo = await getTestDriveBookingRepository();

    // Validate search if provided
    if (filters?.search) {
      validateSearchParams(filters.search);
    }

    const qb = bookingRepo.createQueryBuilder("booking");
    qb.leftJoinAndSelect("booking.car", "car");
    qb.leftJoinAndSelect("car.carMake", "carMake");
    qb.leftJoinAndSelect("car.carColor", "carColor");
    qb.leftJoinAndSelect("booking.user", "user");

    if (filters?.status) {
      qb.andWhere("booking.status = :status", {
        status: validateBookingStatus(filters.status),
      });
    }

    if (filters?.search) {
      const search = `%${filters.search}%`;
      qb.andWhere(
        new Brackets((sqb) => {
          sqb.where("car.model ILIKE :search", { search });
          sqb.orWhere("carMake.name ILIKE :search", { search });
          sqb.orWhere("user.name ILIKE :search", { search });
          sqb.orWhere("user.email ILIKE :search", { search });
        })
      );
    }

    qb.orderBy("booking.bookingDate", "DESC");
    qb.addOrderBy("booking.startTime", "DESC");

    return await qb.getMany();
  }

  /**
   * Updates a booking status.
   */
  static async updateBookingStatus(
    id: string,
    status: BookingStatusEnum
  ): Promise<boolean> {
    const validatedId = validateId(id);
    const validatedStatus = validateBookingStatus(status);
    const bookingRepo = await getTestDriveBookingRepository();
    const result = await bookingRepo.update(validatedId, {
      status: validatedStatus,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Cancels a booking.
   */
  static async cancelBooking(id: string): Promise<boolean> {
    const validatedId = validateId(id);
    return await this.updateBookingStatus(
      validatedId,
      BookingStatusEnum.CANCELLED
    );
  }

  /**
   * Gets booking by ID with relations.
   */
  static async getBookingById(id: string): Promise<TestDriveBooking | null> {
    const validatedId = validateId(id);
    const bookingRepo = await getTestDriveBookingRepository();
    return await bookingRepo.findOne({
      where: { id },
      relations: ["car", "car.carMake", "car.carColor", "user"],
    });
  }

  /**
   * Gets bookings for a specific car on a specific date.
   * Used to check availability when booking.
   */
  static async getCarBookingsForDate(
    carId: string,
    date: Date
  ): Promise<TestDriveBooking[]> {
    const validatedCarId = validateId(carId);
    const bookingRepo = await getTestDriveBookingRepository();

    return await bookingRepo.find({
      where: {
        carId: validatedCarId,
        bookingDate: date,
        status: In([BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED]),
      },
      order: { startTime: "ASC" },
    });
  }

  /**
   * Checks if a time slot is available for a car.
   */
  static async isSlotAvailable(
    carId: string,
    bookingDate: Date,
    startTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const validatedCarId = validateId(carId);
    const validatedExcludeId = excludeBookingId
      ? validateId(excludeBookingId)
      : undefined;
    const bookingRepo = await getTestDriveBookingRepository();

    const where: FindOptionsWhere<TestDriveBooking> = {
      carId: validatedCarId,
      bookingDate,
      startTime,
      status: In([BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED]),
    };

    const existingBooking = await bookingRepo.findOne({ where });

    if (!existingBooking) return true;
    if (validatedExcludeId && existingBooking.id === validatedExcludeId)
      return true;

    return false;
  }

  /**
   * Creates a new test drive booking.
   */
  static async createBooking(
    bookingData: Partial<TestDriveBooking>
  ): Promise<TestDriveBooking> {
    const bookingRepo = await getTestDriveBookingRepository();
    const booking = bookingRepo.create(bookingData);
    return await bookingRepo.save(booking);
  }

  /**
   * Gets dashboard statistics for test drives.
   */
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }> {
    const bookingRepo = await getTestDriveBookingRepository();

    const [total, pending, confirmed, completed, cancelled, noShow] =
      await Promise.all([
        bookingRepo.count(),
        bookingRepo.count({ where: { status: BookingStatusEnum.PENDING } }),
        bookingRepo.count({ where: { status: BookingStatusEnum.CONFIRMED } }),
        bookingRepo.count({ where: { status: BookingStatusEnum.COMPLETED } }),
        bookingRepo.count({ where: { status: BookingStatusEnum.CANCELLED } }),
        bookingRepo.count({ where: { status: BookingStatusEnum.NO_SHOW } }),
      ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      noShow,
    };
  }

  /**
   * Gets car IDs from completed test drives.
   * Used for conversion rate calculations.
   */
  static async getCompletedTestDriveCarIds(): Promise<string[]> {
    const bookingRepo = await getTestDriveBookingRepository();

    const completedBookings = await bookingRepo.find({
      where: { status: BookingStatusEnum.COMPLETED },
      select: ["carId"],
    });

    return completedBookings.map((booking) => booking.carId);
  }
}
