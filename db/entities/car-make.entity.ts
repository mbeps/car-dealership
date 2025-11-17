import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Car } from "./car.entity";

@Entity({ name: "CarMake", schema: "public" })
@Index("CarMake_name_key", ["name"], { unique: true })
@Index("CarMake_slug_key", ["slug"], { unique: true })
export class CarMake {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;

  @Column("text")
  slug!: string;

  @Column("text", { nullable: true })
  country!: string | null;

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
