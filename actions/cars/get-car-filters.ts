"use server";

import { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { createPublicClient } from "@/lib/supabase/supabase";
import type { CarColorOption } from "@/types/car-color/car-color-option";
import type { CarMakeOption } from "@/types/car-make/car-make-option";
import type { ActionResponse } from "@/types/common/action-response";
import type { CarFiltersData } from "@/types/filters/car-filters-data";

type CarWithRelations = {
  carMake?: CarMakeOption | CarMakeOption[] | null;
  carColor?: CarColorOption | CarColorOption[] | null;
};

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
    const supabase = createPublicClient();

    // Get makes and colors that currently have available cars
    const { data: makeAndColorRows } = await supabase
      .from("Car")
      .select(
        `
        carMake:CarMake(id, name, slug, country),
        carColor:CarColor(id, name, slug)
      `,
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
      a.name.localeCompare(b.name),
    );
    const uniqueColors = Array.from(uniqueColorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
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
    throw new Error(`Error fetching car filters:${(error as Error).message}`);
  }
}
