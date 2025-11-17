import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { WorkingHour } from "./working-hour.entity";

@Entity({ name: "DealershipInfo", schema: "public" })
export class DealershipInfo {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { default: "Vehiql Motors" })
  name!: string;

  @Column("text", { default: "69 Car Street, Autoville, CA 69420" })
  address!: string;

  @Column("text", { default: "+1 (555) 123-4567" })
  phone!: string;

  @Column("text", { default: "contact@vehiql.com" })
  email!: string;

  @Column("text", { default: "+1 (555) 123-4567" })
  whatsappPhone!: string;

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
