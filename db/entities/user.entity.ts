import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UserRoleEnum } from "@/types";

@Entity({ name: "User", schema: "public" })
@Index("User_email_key", ["email"], { unique: true })
@Index("User_supabaseAuthUserId_key", ["supabaseAuthUserId"], { unique: true })
export class User {
  @PrimaryColumn("text")
  id!: string;

  @Column("uuid")
  supabaseAuthUserId!: string;

  @Column("text")
  email!: string;

  @Column("text", { nullable: true })
  name!: string | null;

  @Column("text", { nullable: true })
  imageUrl!: string | null;

  @Column("text", { nullable: true })
  phone!: string | null;

  @Column({
    type: "enum",
    enum: UserRoleEnum,
    enumName: "UserRole",
    default: UserRoleEnum.USER,
  })
  role!: UserRoleEnum;

  @CreateDateColumn({
    type: "timestamp without time zone",
    default: () => "timezone('utc', now())",
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
