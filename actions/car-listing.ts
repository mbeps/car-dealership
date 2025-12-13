"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import {
  ActionResponse,
  CarFiltersData,
  SerializedCar,
  CarFilters,
  PaginationInfo,
  UserTestDrive,
  SerializedDealershipInfo,
} from "@/types";
import { withRLS } from "@/db/rls-manager";
import { UserCarService } from "@/db/services/user-car.service";
import { UserService } from "@/db/services/user.service";

/**
 * Computes available filter options from current inventory.
 * Only returns makes/colors/types present in AVAILABLE cars.
 * Calculates price/mileage/age ranges dynamically.
 * Called server-side to hydrate filter UI.
 *
 * @returns Filter metadata with all available options and ranges
 * @see CarFiltersData - Type for filter options
 * @see useCarFilters - Client hook that uses this data
 */
export async function getCarFilters(): Promise<ActionResponse<CarFiltersData>> {
  try {
    // Filters are public, so we can run as anon (userId = null)
    return await withRLS(null, async (manager) => {
      const service = new UserCarService(manager);
      const data = await service.getCarFilters();
      return {
        success: true,
        data,
      };
    });
  } catch (error) {
    throw new Error("Error fetching car filters:" + (error as Error).message);
  }
}

/**
 * Main inventory query with filtering, sorting, and pagination.
 * Checks user wishlist status for each car if authenticated.
 * Translates slug-based filters to IDs and builds complex query.
 *
 * @param filters - Filter params from URL (make, color, price, etc.)
 * @returns Paginated car list with wishlist flags
 * @see CarFilters - Type for filter params
 * @see serializeCarData - Normalizes car data for client
 */
export async function getCars(
  filters: CarFilters = {}
): Promise<
  ActionResponse<{ cars: SerializedCar[]; pagination: PaginationInfo }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    return await withRLS(userId, async (manager) => {
      const service = new UserCarService(manager);
      const result = await service.getCars(filters, userId || undefined);
      return {
        success: true,
        data: result,
      };
    });
  } catch (error) {
    throw new Error("Error fetching cars:" + (error as Error).message);
  }
}

/**
 * Toggles car in user's wishlist.
 * Creates UserSavedCar record or deletes existing.
 * Revalidates saved cars page.
 *
 * @param carId - Car to save/unsave
 * @returns Result with saved status and message for toast
 * @see UserSavedCar - Join table for wishlists
 * @see ROUTES.SAVED_CARS - Page that displays wishlist
 */
export async function toggleSavedCar(
  carId: string
): Promise<ActionResponse<{ saved: boolean; message: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    return await withRLS(user.id, async (manager) => {
      // Ensure user exists in DB
      await UserService.ensureProfileWithManager(
        manager,
        user.id,
        user.email!,
        user.user_metadata
      );

      const carService = new UserCarService(manager);
      const result = await carService.toggleSavedCar(carId, user.id);

      revalidatePath(ROUTES.SAVED_CARS);
      revalidatePath(`/saved-cars`); // Just in case

      return {
        success: true,
        data: result,
      };
    });
  } catch (error) {
    throw new Error("Error toggling saved car:" + (error as Error).message);
  }
}

/**
 * Fetches car details with test drive metadata.
 * Includes dealership info, working hours, existing bookings, user's active booking.
 * Powers both detail page and test drive form.
 *
 * @param carId - Target car ID
 * @returns Car with nested test drive context
 * @see ROUTES.CAR_DETAILS - Detail page
 * @see ROUTES.TEST_DRIVE - Test drive booking page
 */
export async function getCarById(carId: string): Promise<
  ActionResponse<
    SerializedCar & {
      testDriveInfo: {
        userTestDrive: UserTestDrive | null;
        dealership: SerializedDealershipInfo | null;
        existingBookings: Array<{
          date: string;
          startTime: string;
          endTime: string;
        }>;
      };
    }
  >
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || null;

    return await withRLS(userId, async (manager) => {
      const service = new UserCarService(manager);
      const data = await service.getCarById(carId, userId || undefined);

      if (!data) {
        return {
          success: false,
          error: "Car not found",
        };
      }

      return {
        success: true,
        data,
      };
    });
  } catch (error) {
    throw new Error("Error fetching car details:" + (error as Error).message);
  }
}

/**
 * Retrieves user's wishlist with car details.
 * Joins UserSavedCar with full car data and relations.
 * Sorted by most recently saved.
 *
 * @returns User's saved cars with make/color data
 * @see UserSavedCar - Wishlist join table
 * @see ROUTES.SAVED_CARS - Page displaying wishlist
 */
export async function getSavedCars(): Promise<ActionResponse<SerializedCar[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return await withRLS(user.id, async (manager) => {
      // Ensure user exists (though they should if they have saved cars)
      await UserService.ensureProfileWithManager(
        manager,
        user.id,
        user.email!,
        user.user_metadata
      );

      const carService = new UserCarService(manager);
      const data = await carService.getSavedCars(user.id);

      return {
        success: true,
        data,
      };
    });
  } catch (error) {
    console.error("Error fetching saved cars:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
