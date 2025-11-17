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
import { DayOfWeekEnum } from "@/types";
import { DealershipInfo } from "./dealership-info.entity";

@Entity({ name: "WorkingHour", schema: "public" })
@Index(
  "WorkingHour_dealershipId_dayOfWeek_key",
  ["dealershipId", "dayOfWeek"],
  {
    unique: true,
  }
)
@Index("WorkingHour_dealershipId_idx", ["dealershipId"])
@Index("WorkingHour_dayOfWeek_idx", ["dayOfWeek"])
@Index("WorkingHour_isOpen_idx", ["isOpen"])
export class WorkingHour {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  dealershipId!: string;

  @ManyToOne(() => DealershipInfo, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dealershipId" })
  dealership?: DealershipInfo;

  @Column({
    type: "enum",
    enum: DayOfWeekEnum,
    enumName: "DayOfWeek",
  })
  dayOfWeek!: DayOfWeekEnum;

  @Column("text")
  openTime!: string;

  @Column("text")
  closeTime!: string;

  @Column({ type: "boolean", default: true })
  isOpen!: boolean;

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
