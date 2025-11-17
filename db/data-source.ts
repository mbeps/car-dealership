// Import reflect-metadata first to ensure decorators work correctly
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { Car } from "./entities/car.entity";
import { CarMake } from "./entities/car-make.entity";
import { CarColor } from "./entities/car-color.entity";
import { DealershipInfo } from "./entities/dealership-info.entity";
import { WorkingHour } from "./entities/working-hour.entity";
import { UserSavedCar } from "./entities/user-saved-car.entity";
import { TestDriveBooking } from "./entities/test-drive-booking.entity";

// List of all entities
const entities = [
  User,
  Car,
  CarMake,
  CarColor,
  DealershipInfo,
  WorkingHour,
  UserSavedCar,
  TestDriveBooking,
];

// Environment check
function getConnectionUrl(): string {
  // DIRECT_URL is strongly recommended for TypeORM to avoid PgBouncer issues
  // (prepared statements, transactions, etc. may not work correctly with DATABASE_URL)
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL;

  if (directUrl) {
    return directUrl;
  }

  if (databaseUrl) {
    console.warn(
      "WARNING: Using DATABASE_URL instead of DIRECT_URL for TypeORM. " +
        "This may cause issues with PgBouncer. " +
        "For best results, set DIRECT_URL to a direct connection (port 5432)."
    );
    return databaseUrl;
  }

  throw new Error(
    "Database connection string not found. " +
      "Please set DIRECT_URL (recommended) or DATABASE_URL in your .env file. " +
      "DIRECT_URL should be a direct connection (port 5432), not pooled."
  );
}

// Singleton pattern for Next.js
declare global {
  var __typeormDataSource: DataSource | undefined;
}

let dataSourceInstance: DataSource | undefined;

/**
 * Creates a new TypeORM DataSource instance.
 * Should not be called directly - use getDataSource() instead.
 */
function createDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    url: getConnectionUrl(),
    // SSL configuration for Supabase
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    // Entity registration
    entities: entities,
    // Migration configuration
    migrations: ["db/migrations/*.{ts,js}"],
    migrationsTableName: "typeorm_migrations",
    migrationsRun: false, // Don't auto-run migrations
    // Schema synchronization (disable in production)
    synchronize: false,
    // Logging
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : false,
    // Connection pool settings
    extra: {
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  });
}

/**
 * Initializes the TypeORM DataSource if not already initialized.
 * Safe to call multiple times - will return existing connection if already initialized.
 * Uses lazy initialization to avoid Next.js bundling issues.
 *
 * @returns Initialized DataSource instance
 */
export async function getDataSource(): Promise<DataSource> {
  // Use global in development for hot reload, local variable in production
  const cachedDataSource =
    process.env.NODE_ENV === "development"
      ? global.__typeormDataSource
      : dataSourceInstance;

  if (cachedDataSource?.isInitialized) {
    return cachedDataSource;
  }

  const dataSource = cachedDataSource || createDataSource();

  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to initialize TypeORM DataSource:", error);
      throw new Error(
        `Database connection failed: ${errorMessage}. ` +
          "Please check your database credentials and connection string."
      );
    }
  }

  // Cache the instance
  if (process.env.NODE_ENV === "development") {
    global.__typeormDataSource = dataSource;
  } else {
    dataSourceInstance = dataSource;
  }

  return dataSource;
}

/**
 * Closes the TypeORM DataSource connection.
 * Useful for cleanup in tests or serverless functions.
 */
export async function closeDataSource(): Promise<void> {
  const dataSource =
    process.env.NODE_ENV === "development"
      ? global.__typeormDataSource
      : dataSourceInstance;

  if (dataSource?.isInitialized) {
    await dataSource.destroy();

    if (process.env.NODE_ENV === "development") {
      global.__typeormDataSource = undefined;
    } else {
      dataSourceInstance = undefined;
    }
  }
}

// DO NOT export default to avoid eager evaluation
export { DataSource } from "typeorm";
