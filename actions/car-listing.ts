"use server";

import { serializeCarData } from "@/lib/helpers/serialize-car";
import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import type {
  SupabaseClient,
  User as SupabaseAuthUser,
} from "@supabase/supabase-js";
import type { ActionResponse } from "@/types/common/action-response";
import type { CarFiltersData } from "@/types/filters/car-filters-data";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { CarFilters } from "@/types/filters/car-filters";
import type { PaginationInfo } from "@/types/common/pagination-info";
import type { UserTestDrive } from "@/types/test-drive/user-test-drive";
import type { SerializedDealershipInfo } from "@/types/dealership/serialized-dealership-info";
import type { User as DbUser } from "@/types/user/user";
import type { CarMakeOption } from "@/types/car-make/car-make-option";
import type { CarColorOption } from "@/types/car-color/car-color-option";
import { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";

type DatabaseClient = SupabaseClient;

/**
 * Resolves make slug to database ID.
 * Used for translating URL params to database filters.
 *
 * @param supabase - Supabase client instance
 * @param slug - Make slug from URL
 * @returns Make ID or null if not found
 */
async function getMakeIdBySlug(
  supabase: DatabaseClient,
  slug: string
): Promise<string | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.id ?? null;
}

/**
 * Resolves color slug to database ID.
 * Used for translating URL params to database filters.
 *
 * @param supabase - Supabase client instance
 * @param slug - Color slug from URL
 * @returns Color ID or null if not found
 */
async function getColorIdBySlug(
  supabase: DatabaseClient,
  slug: string
): Promise<string | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data?.id ?? null;
}

/**
 * Searches makes by name for search queries.
 * Enables searching cars by make name.
 *
 * @param supabase - Supabase client instance
 * @param search - Search term
 * @returns Array of matching make IDs
 */
async function getMakeIdsForSearch(
  supabase: DatabaseClient,
  search: string
): Promise<string[]> {
  if (!search) return [];

  const { data, error } = await supabase
    .from("CarMake")
    .select("id")
    .ilike("name", `%${search}%`);

  if (error) {
    throw error;
  }

  return data?.map((item) => item.id) ?? [];
}

/**
 * Searches colors by name for search queries.
 * Enables searching cars by color name.
 *
 * @param supabase - Supabase client instance
 * @param search - Search term
 * @returns Array of matching color IDs
 */
async function getColorIdsForSearch(
  supabase: DatabaseClient,
  search: string
): Promise<string[]> {
  if (!search) return [];

  const { data, error } = await supabase
    .from("CarColor")
    .select("id")
    .ilike("name", `%${search}%`);

  if (error) {
    throw error;
  }

  return data?.map((item) => item.id) ?? [];
}

/**
 * Ensures auth user has database profile.
 * Similar to ensureProfile but for action context.
 * Creates profile from OAuth metadata if needed.
 *
 * @param supabase - Supabase client instance
 * @param authUser - Authenticated Supabase user
 * @returns Database user record
 * @throws Error if profile creation fails
 */
async function getOrCreateDbUser(
  supabase: DatabaseClient,
  authUser: SupabaseAuthUser
): Promise<DbUser> {
  const { data: user, error } = await supabase
    .from("User")
    .select("*")
    .eq("supabaseAuthUserId", authUser.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (user) {
    return user as DbUser;
  }

  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  const profilePayload = {
    id: authUser.id,
    supabaseAuthUserId: authUser.id,
    email: authUser.email || "",
    name,
    imageUrl:
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null,
    phone: authUser.user_metadata?.phone || null,
  };

  const { data: newUser, error: createError } = await supabase
    .from("User")
    .insert(profilePayload)
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newUser as DbUser;
}

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
    const supabase = await createClient();

    // Get makes and colors that currently have available cars
    const { data: makeAndColorRows } = await supabase
      .from("Car")
      .select(
        `
        carMake:CarMake(id, name, slug, country),
        carColor:CarColor(id, name, slug)
      `
      )
      .eq("status", CarStatus.AVAILABLE);

    // Get unique body types
    const { data: bodyTypes } = await supabase
      .from("Car")
      .select("bodyType")
      .eq("status", CarStatus.AVAILABLE)
      .order("bodyType", { ascending: true });

    // Get unique fuel types
    const { data: fuelTypes } = await supabase
      .from("Car")
      .select("fuelType")
      .eq("status", CarStatus.AVAILABLE)
      .order("fuelType", { ascending: true });

    // Get unique transmissions
    const { data: transmissions } = await supabase
      .from("Car")
      .select("transmission")
      .eq("status", CarStatus.AVAILABLE)
      .order("transmission", { ascending: true });

    // Get min and max prices
    const { data: priceData } = await supabase
      .from("Car")
      .select("price")
      .eq("status", CarStatus.AVAILABLE);

    const prices =
      priceData?.map((car) => parseFloat(car.price.toString())) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

    // Get min and max mileage
    const { data: mileageData } = await supabase
      .from("Car")
      .select("mileage")
      .eq("status", CarStatus.AVAILABLE);

    const mileages = mileageData?.map((car) => car.mileage) || [];
    const minMileage = mileages.length > 0 ? Math.min(...mileages) : 0;
    const maxMileage = mileages.length > 0 ? Math.max(...mileages) : 200000;

    // Get min and max age based on year
    const { data: yearData } = await supabase
      .from("Car")
      .select("year")
      .eq("status", CarStatus.AVAILABLE);

    const currentYear = new Date().getFullYear();
    const years = yearData?.map((car) => car.year) || [];
    const ages = years.map((year) => currentYear - year);
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 20;

    // Remove duplicates
    const uniqueMakesMap = new Map<string, CarMakeOption>();
    const uniqueColorsMap = new Map<string, CarColorOption>();

    type CarWithRelations = {
      carMake?: CarMakeOption | CarMakeOption[] | null;
      carColor?: CarColorOption | CarColorOption[] | null;
    };

    (makeAndColorRows as CarWithRelations[] | null)?.forEach((entry) => {
      const makeRaw = entry.carMake;
      const make = Array.isArray(makeRaw) ? makeRaw[0] : makeRaw;
      if (make && !uniqueMakesMap.has(make.id)) {
        uniqueMakesMap.set(make.id, {
          id: make.id,
          name: make.name,
          slug: make.slug,
          country: make.country,
        });
      }

      const colorRaw = entry.carColor;
      const color = Array.isArray(colorRaw) ? colorRaw[0] : colorRaw;
      if (color && !uniqueColorsMap.has(color.id)) {
        uniqueColorsMap.set(color.id, {
          id: color.id,
          name: color.name,
          slug: color.slug,
        });
      }
    });

    const uniqueMakes = Array.from(uniqueMakesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const uniqueColors = Array.from(uniqueColorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const uniqueBodyTypes = [
      ...new Set(bodyTypes?.map((b) => b.bodyType) || []),
    ];
    const uniqueFuelTypes = [
      ...new Set(fuelTypes?.map((f) => f.fuelType) || []),
    ];
    const uniqueTransmissions = [
      ...new Set(transmissions?.map((t) => t.transmission) || []),
    ];

    return {
      success: true,
      data: {
        makes: uniqueMakes,
        colors: uniqueColors,
        bodyTypes: uniqueBodyTypes,
        fuelTypes: uniqueFuelTypes,
        transmissions: uniqueTransmissions,
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        mileageRange: {
          min: minMileage,
          max: maxMileage,
        },
        ageRange: {
          min: minAge,
          max: maxAge,
        },
      },
    };
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
    const {
      search = "",
      make = "",
      color = "",
      bodyType = "",
      fuelType = "",
      transmission = "",
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      minMileage = 0,
      maxMileage = Number.MAX_SAFE_INTEGER,
      minAge = 0,
      maxAge = Number.MAX_SAFE_INTEGER,
      sortBy = "newest",
      page = 1,
      limit = 6,
    } = filters;

    const supabase = await createClient();

    // Get current user if authenticated
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let dbUser = null;

    if (authUser) {
      const { data } = await supabase
        .from("User")
        .select("*")
        .eq("supabaseAuthUserId", authUser.id)
        .single();
      dbUser = data;
    }

    const makeFilterId = make ? await getMakeIdBySlug(supabase, make) : null;
    const colorFilterId = color
      ? await getColorIdBySlug(supabase, color)
      : null;

    if ((make && !makeFilterId) || (color && !colorFilterId)) {
      return {
        success: true,
        data: {
          cars: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        },
      };
    }

    const makeSearchIds = search
      ? await getMakeIdsForSearch(supabase, search)
      : [];
    const colorSearchIds = search
      ? await getColorIdsForSearch(supabase, search)
      : [];

    // Build query
    let query = supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `,
        { count: "exact" }
      )
      .eq("status", CarStatus.AVAILABLE);

    // Add search filter
    if (search) {
      const searchClauses = [
        `model.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `bodyType.ilike.%${search}%`,
        `numberPlate.ilike.%${search}%`,
      ];

      if (makeSearchIds.length) {
        makeSearchIds.forEach((id) => {
          searchClauses.push(`carMakeId.eq.${id}`);
        });
      }

      if (colorSearchIds.length) {
        colorSearchIds.forEach((id) => {
          searchClauses.push(`carColorId.eq.${id}`);
        });
      }

      query = query.or(searchClauses.join(","));
    }

    // Add filters
    if (makeFilterId) query = query.eq("carMakeId", makeFilterId);
    if (colorFilterId) query = query.eq("carColorId", colorFilterId);
    if (bodyType) query = query.ilike("bodyType", bodyType);
    if (fuelType) query = query.ilike("fuelType", fuelType);
    if (transmission) query = query.ilike("transmission", transmission);

    // Add price range
    query = query.gte("price", minPrice);
    if (maxPrice && maxPrice < Number.MAX_SAFE_INTEGER) {
      query = query.lte("price", maxPrice);
    }

    // Add mileage range
    query = query.gte("mileage", minMileage);
    if (maxMileage && maxMileage < Number.MAX_SAFE_INTEGER) {
      query = query.lte("mileage", maxMileage);
    }

    // Add age range (filter by year)
    if (minAge > 0 || maxAge < Number.MAX_SAFE_INTEGER) {
      const currentYear = new Date().getFullYear();
      const maxYear = currentYear - minAge;
      const minYear =
        maxAge < Number.MAX_SAFE_INTEGER ? currentYear - maxAge : 0;

      query = query.lte("year", maxYear);
      if (minYear > 0) {
        query = query.gte("year", minYear);
      }
    }

    // Add sorting
    switch (sortBy) {
      case "priceAsc":
        query = query.order("price", { ascending: true });
        break;
      case "priceDesc":
        query = query.order("price", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("createdAt", { ascending: false });
        break;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: cars, error, count } = await query;

    if (error) throw error;

    // If we have a user, check which cars are wishlisted
    let wishlisted = new Set<string>();
    if (dbUser) {
      const { data: savedCars } = await supabase
        .from("UserSavedCar")
        .select("carId")
        .eq("userId", dbUser.id);

      wishlisted = new Set(savedCars?.map((saved) => saved.carId) || []);
    }

    // Serialize and check wishlist status
    const serializedCars = (cars || []).map((car) =>
      serializeCarData(car, wishlisted.has(car.id))
    );

    return {
      success: true,
      data: {
        cars: serializedCars,
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    };
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
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const user = await getOrCreateDbUser(supabase, authUser);

    // Check if car exists
    const { data: car } = await supabase
      .from("Car")
      .select("id")
      .eq("id", carId)
      .single();

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Check if car is already saved
    const { data: existingSave, error: existingSaveError } = await supabase
      .from("UserSavedCar")
      .select("*")
      .eq("userId", user.id)
      .eq("carId", carId)
      .maybeSingle();

    if (existingSaveError && existingSaveError.code !== "PGRST116") {
      throw existingSaveError;
    }

    // If car is already saved, remove it
    if (existingSave) {
      const { error: deleteError } = await supabase
        .from("UserSavedCar")
        .delete()
        .eq("userId", user.id)
        .eq("carId", carId);

      if (deleteError) {
        throw deleteError;
      }

      revalidatePath(ROUTES.SAVED_CARS);
      return {
        success: true,
        data: {
          saved: false,
          message: "Car removed from favorites",
        },
      };
    }

    // If car is not saved, add it
    const { error: insertError } = await supabase.from("UserSavedCar").insert({
      userId: user.id,
      carId,
    });

    if (insertError) {
      throw insertError;
    }

    revalidatePath(`/saved-cars`);
    return {
      success: true,
      data: {
        saved: true,
        message: "Car added to favorites",
      },
    };
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

    // Get current user if authenticated
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    let dbUser = null;

    if (authUser) {
      const { data } = await supabase
        .from("User")
        .select("*")
        .eq("supabaseAuthUserId", authUser.id)
        .single();
      dbUser = data;
    }

    // Get car details
    const { data: car, error } = await supabase
      .from("Car")
      .select(
        `
        *,
        carMake:CarMake(id, name, slug),
        carColor:CarColor(id, name, slug)
      `
      )
      .eq("id", carId)
      .single();

    if (error || !car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Check if car is wishlisted by user
    let isWishlisted = false;
    if (dbUser) {
      const { data: savedCar } = await supabase
        .from("UserSavedCar")
        .select("*")
        .eq("userId", dbUser.id)
        .eq("carId", carId)
        .single();

      isWishlisted = !!savedCar;
    }

    // Check if user has already booked a test drive for this car
    let userTestDrive: UserTestDrive | null = null;

    if (dbUser) {
      const { data: existingTestDrive } = await supabase
        .from("TestDriveBooking")
        .select("*")
        .eq("carId", carId)
        .eq("userId", dbUser.id)
        .in("status", [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
        ])
        .order("createdAt", { ascending: false })
        .limit(1)
        .single();

      if (existingTestDrive) {
        userTestDrive = {
          id: existingTestDrive.id,
          status: existingTestDrive.status,
          bookingDate: existingTestDrive.bookingDate,
        };
      }
    }

    // Get dealership info for test drive availability
    const { data: dealership } = await supabase
      .from("DealershipInfo")
      .select(
        `
        *,
        workingHours:WorkingHour(*)
      `
      )
      .single();

    // Get existing bookings for this car to show unavailable slots
    const { data: existingBookings } = await supabase
      .from("TestDriveBooking")
      .select("bookingDate, startTime, endTime")
      .eq("carId", carId)
      .in("status", [BookingStatus.PENDING, BookingStatus.CONFIRMED])
      .gte("bookingDate", new Date().toISOString().split("T")[0]);

    return {
      success: true,
      data: {
        ...serializeCarData(car, isWishlisted),
        testDriveInfo: {
          userTestDrive,
          dealership: dealership || null,
          existingBookings: (existingBookings || []).map((booking) => ({
            date: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
          })),
        },
      },
    };
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
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = await getOrCreateDbUser(supabase, authUser);

    // Get saved cars with their details
    const { data: savedCars, error } = await supabase
      .from("UserSavedCar")
      .select(
        `
        *,
        car:Car(
          *,
          carMake:CarMake(id, name, slug),
          carColor:CarColor(id, name, slug)
        )
      `
      )
      .eq("userId", user.id)
      .order("savedAt", { ascending: false });

    if (error) throw error;

    // Extract and format car data
    const cars = (savedCars || []).map((saved) => serializeCarData(saved.car));

    return {
      success: true,
      data: cars,
    };
  } catch (error) {
    console.error("Error fetching saved cars:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
