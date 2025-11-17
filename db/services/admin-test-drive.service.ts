/**
 * Admin service for managing test drive bookings.
 */

import { Between, In, FindOptionsWhere } from "typeorm";
import { getTestDriveBookingRepository } from "@/db/repositories";
import { TestDriveBooking } from "@/db/entities";
import { BookingStatusEnum } from "@/types";

export class AdminTestDriveService {
  /**
   * Gets all test drive bookings with optional filters.
   */
  static async getBookings(filters?: {
    status?: BookingStatusEnum;
    search?: string;
  }): Promise<TestDriveBooking[]> {
    const bookingRepo = await getTestDriveBookingRepository();

    const where: FindOptionsWhere<TestDriveBooking> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const bookings = await bookingRepo.find({
      where,
      relations: ["car", "car.carMake", "car.carColor", "user"],
      order: { bookingDate: "DESC", startTime: "DESC" },
    });

    return bookings;
  }

  /**
   * Updates a booking status.
   */
  static async updateBookingStatus(
    id: string,
    status: BookingStatusEnum
  ): Promise<boolean> {
    const bookingRepo = await getTestDriveBookingRepository();
    const result = await bookingRepo.update(id, { status });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Cancels a booking.
   */
  static async cancelBooking(id: string): Promise<boolean> {
    return await this.updateBookingStatus(id, BookingStatusEnum.CANCELLED);
  }

  /**
   * Gets booking by ID with relations.
   */
  static async getBookingById(id: string): Promise<TestDriveBooking | null> {
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
    const bookingRepo = await getTestDriveBookingRepository();

    return await bookingRepo.find({
      where: {
        carId,
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
    const bookingRepo = await getTestDriveBookingRepository();

    const where: FindOptionsWhere<TestDriveBooking> = {
      carId,
      bookingDate,
      startTime,
      status: In([BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED]),
    };

    const existingBooking = await bookingRepo.findOne({ where });

    if (!existingBooking) return true;
    if (excludeBookingId && existingBooking.id === excludeBookingId)
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
