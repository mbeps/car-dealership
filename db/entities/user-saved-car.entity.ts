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
import { User } from "./user.entity";
import { Car } from "./car.entity";

@Entity({ name: "UserSavedCar", schema: "public" })
@Index("UserSavedCar_userId_carId_key", ["userId", "carId"], { unique: true })
@Index("UserSavedCar_userId_idx", ["userId"])
@Index("UserSavedCar_carId_idx", ["carId"])
export class UserSavedCar {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column("text")
  carId!: string;

  @ManyToOne(() => Car, { onDelete: "CASCADE" })
  @JoinColumn({ name: "carId" })
  car?: Car;

  @CreateDateColumn({
    type: "timestamp without time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  savedAt!: Date;

  @UpdateDateColumn({
    type: "timestamp without time zone",
    default: () => "timezone('utc', now())",
  })
  updatedAt!: Date;
}
