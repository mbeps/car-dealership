import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { BookingStatusEnum } from "@/types";
import { User } from "./user.entity";
import { Car } from "./car.entity";

/**
 * TestDriveBooking entity
 *
 * IMPORTANT: There is a partial unique index in the database that cannot be
 * expressed via TypeORM decorators:
 *
 * CREATE UNIQUE INDEX "TestDriveBooking_unique_slot"
 *   ON public."TestDriveBooking" ("carId", "bookingDate", "startTime")
 *   WHERE "status" IN ('PENDING', 'CONFIRMED');
 *
 * This constraint prevents double-booking of time slots but allows multiple
 * cancelled/completed bookings for the same slot. The constraint is maintained
 * in SQL migrations (database/001_schema.sql) and must be preserved manually
 * when generating TypeORM migrations.
 */
@Entity({ name: "TestDriveBooking", schema: "public" })
@Index("TestDriveBooking_carId_idx", ["carId"])
@Index("TestDriveBooking_userId_idx", ["userId"])
@Index("TestDriveBooking_bookingDate_idx", ["bookingDate"])
@Index("TestDriveBooking_status_idx", ["status"])
export class TestDriveBooking {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  carId!: string;

  @ManyToOne(() => Car, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "carId" })
  car?: Car;

  @Column("text")
  userId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column("date")
  bookingDate!: Date;

  @Column("text")
  startTime!: string;

  @Column("text")
  endTime!: string;

  @Column({
    type: "enum",
    enum: BookingStatusEnum,
    enumName: "BookingStatus",
    default: BookingStatusEnum.PENDING,
  })
  status!: BookingStatusEnum;

  @Column("text", { nullable: true })
  notes!: string | null;

  @CreateDateColumn({
    type: "timestamp without time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp without time zone",
    default: () => "timezone('utc', now())",
  })
  updatedAt!: Date;
}
