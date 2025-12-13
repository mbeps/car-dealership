import { EntityManager } from "typeorm";
import { TestDriveBooking } from "../entities/test-drive-booking.entity";
import { Car } from "../entities/car.entity";
import { User } from "../entities/user.entity";
import {
  TestDriveFormData,
  TestDriveBookingWithCar,
  SerializedCar,
  CarStatusEnum,
  BookingStatusEnum,
} from "@/types";
import { serializeCarData } from "@/lib/helpers";

export class UserTestDriveService {
  constructor(private manager: EntityManager) {}

  async bookTestDrive(
    formData: TestDriveFormData,
    userId: string
  ): Promise<TestDriveBooking> {
    const { carId, bookingDate, startTime, endTime, notes } = formData;

    const user = await this.manager.findOne(User, {
      where: { supabaseAuthUserId: userId },
    });

    if (!user) throw new Error("User not found in database");

    if (user.role === "ADMIN") {
      throw new Error(
        "Admins cannot book test drives. Please use the admin panel to manage bookings."
      );
    }

    const car = await this.manager.findOne(Car, {
      where: { id: carId, status: CarStatusEnum.AVAILABLE },
    });

    if (!car) throw new Error("Car not available for test drive");

    // Check for existing booking
    const existingBooking = await this.manager
      .createQueryBuilder(TestDriveBooking, "booking")
      .where("booking.carId = :carId", { carId })
      .andWhere("booking.bookingDate = :bookingDate", { bookingDate })
      .andWhere("booking.startTime = :startTime", { startTime })
      .andWhere("booking.status IN (:...statuses)", {
        statuses: [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED],
      })
      .getOne();

    if (existingBooking) {
      throw new Error(
        "This time slot is already booked. Please select another time."
      );
    }

    const booking = new TestDriveBooking();
    booking.carId = carId;
    booking.userId = user.id;
    booking.bookingDate = new Date(bookingDate);
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.notes = notes || null;
    booking.status = BookingStatusEnum.PENDING;

    return await this.manager.save(booking);
  }

  async getUserTestDrives(userId: string): Promise<TestDriveBookingWithCar[]> {
    const user = await this.manager.findOne(User, {
      where: { supabaseAuthUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const bookings = await this.manager.find(TestDriveBooking, {
      where: { userId: user.id },
      relations: ["car", "car.carMake", "car.carColor"],
      order: { bookingDate: "DESC" },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      carId: booking.carId,
      car: serializeCarData(booking.car),
      userId: booking.userId,
      bookingDate:
        booking.bookingDate instanceof Date
          ? booking.bookingDate.toISOString().split("T")[0]
          : (booking.bookingDate as unknown as string),
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }));
  }

  async cancelTestDrive(bookingId: string, userId: string): Promise<string> {
    const user = await this.manager.findOne(User, {
      where: { supabaseAuthUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const booking = await this.manager.findOne(TestDriveBooking, {
      where: { id: bookingId },
    });

    if (!booking) throw new Error("Booking not found");

    // Ownership check is also enforced by RLS, but good to have here too
    if (booking.userId !== user.id && user.role !== "ADMIN") {
      throw new Error("Unauthorized to cancel this booking");
    }

    if (booking.status === BookingStatusEnum.CANCELLED) {
      throw new Error("Booking is already cancelled");
    }

    if (booking.status === BookingStatusEnum.COMPLETED) {
      throw new Error("Cannot cancel a completed booking");
    }

    booking.status = BookingStatusEnum.CANCELLED;
    await this.manager.save(booking);

    return "Test drive cancelled successfully";
  }
}
