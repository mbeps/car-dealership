"use server";

import { createClient } from "@/lib/supabase/supabase";
import { serializeCarData } from "@/lib/helpers/serialize-car";
import type { ActionResponse } from "@/types/common/action-response";
import type { SerializedCar } from "@/types/car/serialized-car";
import type { CarFilters } from "@/types/filters/car-filters";
import type { PaginationInfo } from "@/types/common/pagination-info";
import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { getColorIdBySlug } from "./get-color-id-by-slug";
import { getColorIdsForSearch } from "./get-color-ids-for-search";
import { getMakeIdBySlug } from "./get-make-id-by-slug";
import { getMakeIdsForSearch } from "./get-make-ids-for-search";

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
  filters: CarFilters = {},
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
        { count: "exact" },
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
      serializeCarData(car, wishlisted.has(car.id)),
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
