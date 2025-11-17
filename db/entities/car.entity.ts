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
import { CarStatusEnum } from "@/types";
import { CarMake } from "./car-make.entity";
import { CarColor } from "./car-color.entity";

// Transformer for numeric fields from Supabase
const numericTransformer = {
  to: (value: number | null) =>
    value === null || value === undefined ? value : value,
  from: (value: string | null) =>
    value === null || value === undefined ? null : parseFloat(value),
};

@Entity({ name: "Car", schema: "public" })
@Index("Car_carMakeId_model_idx", ["carMakeId", "model"])
@Index("Car_bodyType_idx", ["bodyType"])
@Index("Car_price_idx", ["price"])
@Index("Car_year_idx", ["year"])
@Index("Car_status_idx", ["status"])
@Index("Car_fuelType_idx", ["fuelType"])
@Index("Car_featured_idx", ["featured"])
@Index("Car_carMakeId_idx", ["carMakeId"])
@Index("Car_carColorId_idx", ["carColorId"])
@Index("Car_numberPlate_idx", ["numberPlate"])
export class Car {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  carMakeId!: string;

  @ManyToOne(() => CarMake, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "carMakeId" })
  carMake?: CarMake;

  @Column("text")
  carColorId!: string;

  @ManyToOne(() => CarColor, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "carColorId" })
  carColor?: CarColor;

  @Column("text")
  model!: string;

  @Column("integer")
  year!: number;

  @Column("numeric", {
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  price!: number;

  @Column("integer")
  mileage!: number;

  @Column("text")
  fuelType!: string;

  @Column("text")
  transmission!: string;

  @Column("text")
  bodyType!: string;

  @Column("text")
  numberPlate!: string;

  @Column("integer", { nullable: true })
  seats!: number | null;

  @Column("text")
  description!: string;

  @Column({
    type: "enum",
    enum: CarStatusEnum,
    enumName: "CarStatus",
    default: CarStatusEnum.AVAILABLE,
  })
  status!: CarStatusEnum;

  @Column({ type: "boolean", default: false })
  featured!: boolean;

  @Column("text", { array: true, nullable: true })
  features!: string[] | null;

  @Column("text", { array: true, nullable: true })
  images!: string[] | null;

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

  // Relations removed to avoid circular dependencies
  // Use repositories to fetch related data when needed
}
