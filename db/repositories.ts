import { Repository } from "typeorm";
import { getDataSource } from "./data-source";
import {
  User,
  Car,
  CarMake,
  CarColor,
  DealershipInfo,
  WorkingHour,
  UserSavedCar,
  TestDriveBooking,
} from "./entities";

/**
 * Gets the User repository from TypeORM DataSource.
 * @returns User repository instance
 */
export async function getUserRepository(): Promise<Repository<User>> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(User);
}

/**
 * Gets the Car repository from TypeORM DataSource.
 * @returns Car repository instance
 */
export async function getCarRepository(): Promise<Repository<Car>> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(Car);
}

/**
 * Gets the CarMake repository from TypeORM DataSource.
 * @returns CarMake repository instance
 */
export async function getCarMakeRepository(): Promise<Repository<CarMake>> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(CarMake);
}

/**
 * Gets the CarColor repository from TypeORM DataSource.
 * @returns CarColor repository instance
 */
export async function getCarColorRepository(): Promise<Repository<CarColor>> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(CarColor);
}

/**
 * Gets the DealershipInfo repository from TypeORM DataSource.
 * @returns DealershipInfo repository instance
 */
export async function getDealershipInfoRepository(): Promise<
  Repository<DealershipInfo>
> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(DealershipInfo);
}

/**
 * Gets the WorkingHour repository from TypeORM DataSource.
 * @returns WorkingHour repository instance
 */
export async function getWorkingHourRepository(): Promise<
  Repository<WorkingHour>
> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(WorkingHour);
}

/**
 * Gets the UserSavedCar repository from TypeORM DataSource.
 * @returns UserSavedCar repository instance
 */
export async function getUserSavedCarRepository(): Promise<
  Repository<UserSavedCar>
> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(UserSavedCar);
}

/**
 * Gets the TestDriveBooking repository from TypeORM DataSource.
 * @returns TestDriveBooking repository instance
 */
export async function getTestDriveBookingRepository(): Promise<
  Repository<TestDriveBooking>
> {
  const dataSource = await getDataSource();
  return dataSource.getRepository(TestDriveBooking);
}
