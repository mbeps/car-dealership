import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getCarById } from "@/actions/cars/get-car-by-id";
import { getCarFilters } from "@/actions/cars/get-car-filters";
import { getCars } from "@/actions/cars/get-public-cars";
import { getFAQs } from "@/actions/home/get-faqs";
import { getFeaturedCars } from "@/actions/home/get-featured-cars";
import { getHomePageContent } from "@/actions/home/get-home-page-content";
import { getDealershipInfo } from "@/actions/settings/get-dealership-info";
import {
  formatActionResult,
  formatToolResponse,
  normalizeSlug,
} from "@/lib/mcp/helpers";

/**
 * Registers public inventory and information tools accessible to Guest, User, and Admin callers.
 */
export function registerPublicTools(server: McpServer) {
  server.registerTool(
    "search_cars",
    {
      title: "Search Cars",
      description:
        "Search and filter available cars in the dealership inventory with sorting and pagination. If the caller is authenticated, each car indicates whether it is on their wishlist.",
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe(
            "Search term matching model, description, make, color, or number plate",
          ),
        make: z
          .string()
          .optional()
          .describe(
            "Car make name or slug (e.g. 'Tesla', 'Aston Martin', 'bmw')",
          ),
        color: z
          .string()
          .optional()
          .describe("Car color name or slug (e.g. 'Red', 'midnight-black')"),
        bodyType: z
          .string()
          .optional()
          .describe("Body type (e.g. 'Sedan', 'SUV', 'Coupe', 'Hatchback')"),
        fuelType: z
          .string()
          .optional()
          .describe(
            "Fuel type (e.g. 'Electric', 'Petrol', 'Diesel', 'Hybrid')",
          ),
        transmission: z
          .string()
          .optional()
          .describe("Transmission (e.g. 'Automatic', 'Manual')"),
        minPrice: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Minimum price in EUR"),
        maxPrice: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Maximum price in EUR"),
        minMileage: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Minimum mileage in km"),
        maxMileage: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Maximum mileage in km"),
        minAge: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Minimum car age in years"),
        maxAge: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe("Maximum car age in years"),
        sortBy: z
          .enum(["newest", "priceAsc", "priceDesc"])
          .optional()
          .describe("Sort order: newest, priceAsc, or priceDesc"),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number (default: 1)"),
        limit: z
          .number()
          .int()
          .positive()
          .max(50)
          .optional()
          .describe("Results per page (default: 6, max: 50)"),
      }),
    },
    async (args) => {
      try {
        const filters = {
          ...args,
          make: normalizeSlug(args.make),
          color: normalizeSlug(args.color),
        };
        const result = await getCars(filters);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "get_car_details",
    {
      title: "Get Car Details",
      description:
        "Fetch comprehensive car details by ID including specs, dealership info, working hours, booked test-drive slots, and caller's active test drive.",
      inputSchema: z.object({
        carId: z.string().describe("The unique ID of the car"),
      }),
    },
    async ({ carId }) => {
      try {
        const result = await getCarById(carId);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "get_car_filters",
    {
      title: "Get Car Filters",
      description:
        "Get available filter metadata based on current available cars: available makes, colors, body types, fuel types, transmissions, and min/max ranges for price, mileage, and age.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await getCarFilters();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "get_featured_cars",
    {
      title: "Get Featured Cars",
      description:
        "Get featured available cars showcased on the dealership homepage.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .default(3)
          .describe("Max number of featured cars to return (default: 3)"),
      }),
    },
    async ({ limit }) => {
      try {
        const cars = await getFeaturedCars(limit);
        return formatToolResponse(cars);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "get_dealership_info",
    {
      title: "Get Dealership Information",
      description:
        "Get dealership contact details (name, address, phone, email, WhatsApp) and regular weekly working hours.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await getDealershipInfo();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "get_home_content",
    {
      title: "Get Homepage Content & FAQs",
      description:
        "Get dealership homepage marketing headlines, hero copy, feature highlights, and frequently asked questions.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const [homeContent, faqs] = await Promise.all([
          getHomePageContent(),
          getFAQs(),
        ]);
        return formatToolResponse({ homeContent, faqs });
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );
}
