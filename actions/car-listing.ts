"use server";

import { serializeCarData } from "@/lib/helpers";
import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type {
  SupabaseClient,
  User as SupabaseAuthUser,
} from "@supabase/supabase-js";
import {
  ActionResponse,
  CarFiltersData,
  SerializedCar,
  CarFilters,
  PaginationInfo,
  UserTestDrive,
  SerializedDealershipInfo,
  User as DbUser,
} from "@/types";

type DatabaseClient = SupabaseClient<any>;

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
 * Get simplified filters for the car marketplace
 */
export async function getCarFilters(): Promise<ActionResponse<CarFiltersData>> {
  try {
    const supabase = await createClient();

    // Get unique makes
    const { data: makes } = await supabase
      .from("Car")
      .select("make")
      .eq("status", "AVAILABLE")
      .order("make", { ascending: true });

    // Get unique body types
    const { data: bodyTypes } = await supabase
      .from("Car")
      .select("bodyType")
      .eq("status", "AVAILABLE")
      .order("bodyType", { ascending: true });

    // Get unique fuel types
    const { data: fuelTypes } = await supabase
      .from("Car")
      .select("fuelType")
      .eq("status", "AVAILABLE")
      .order("fuelType", { ascending: true });

    // Get unique transmissions
    const { data: transmissions } = await supabase
      .from("Car")
      .select("transmission")
      .eq("status", "AVAILABLE")
      .order("transmission", { ascending: true });

    // Get min and max prices
    const { data: priceData } = await supabase
      .from("Car")
      .select("price")
      .eq("status", "AVAILABLE");

    const prices =
      priceData?.map((car) => parseFloat(car.price.toString())) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000;

    // Get min and max mileage
    const { data: mileageData } = await supabase
      .from("Car")
      .select("mileage")
      .eq("status", "AVAILABLE");

    const mileages = mileageData?.map((car) => car.mileage) || [];
    const minMileage = mileages.length > 0 ? Math.min(...mileages) : 0;
    const maxMileage = mileages.length > 0 ? Math.max(...mileages) : 200000;

    // Get min and max age based on year
    const { data: yearData } = await supabase
      .from("Car")
      .select("year")
      .eq("status", "AVAILABLE");

    const currentYear = new Date().getFullYear();
    const years = yearData?.map((car) => car.year) || [];
    const ages = years.map((year) => currentYear - year);
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 20;

    // Remove duplicates
    const uniqueMakes = [...new Set(makes?.map((m) => m.make) || [])];
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
 * Get cars with simplified filters
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

    // Build query
    let query = supabase
      .from("Car")
      .select("*", { count: "exact" })
      .eq("status", "AVAILABLE");

    // Add search filter
    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Add filters
    if (make) query = query.ilike("make", make);
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
 * Toggle car in user's wishlist
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

      revalidatePath(`/saved-cars`);
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
 * Get car details by ID
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
      .select("*")
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
        .in("status", ["PENDING", "CONFIRMED", "COMPLETED"])
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
      .in("status", ["PENDING", "CONFIRMED"])
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
 * Get user's saved cars
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
        car:Car(*)
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
