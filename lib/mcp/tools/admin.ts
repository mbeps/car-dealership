import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getAdminTestDrives } from "@/actions/admin/get-admin-test-drives";
import { getDashboardData } from "@/actions/admin/get-dashboard-data";
import { updateTestDriveStatus } from "@/actions/admin/update-test-drive-status";
import { deleteCar } from "@/actions/cars/delete-car";
import { getCarColors } from "@/actions/cars/get-car-colors";
import { getCarMakes } from "@/actions/cars/get-car-makes";
import { getCars } from "@/actions/cars/get-cars";
import { updateCar } from "@/actions/cars/update-car";
import { updateCarStatus } from "@/actions/cars/update-car-status";
import { addFAQ } from "@/actions/home/add-faq";
import { deleteFAQ } from "@/actions/home/delete-faq";
import { reorderFAQs } from "@/actions/home/reorder-faqs";
import { updateFAQ } from "@/actions/home/update-faq";
import { updateHomePageContent } from "@/actions/home/update-home-page-content";
import { getUsers } from "@/actions/settings/get-users";
import { saveWorkingHours } from "@/actions/settings/save-working-hours";
import { updateDealershipInfo } from "@/actions/settings/update-dealership-info";
import { updateUserRole } from "@/actions/settings/update-user-role";
import { checkStorageQuota } from "@/actions/storage/check-storage-quota";
import type { BookingStatusEnum as BookingStatus } from "@/enums/booking-status";
import type { CarStatusEnum as CarStatus } from "@/enums/car-status";
import { DayOfWeekEnum } from "@/enums/day-of-week";
import type { UserRoleEnum as UserRole } from "@/enums/user-role";
import { requireAdmin } from "@/lib/mcp/auth";
import { formatActionResult, formatToolResponse } from "@/lib/mcp/helpers";

/**
 * Registers administrator workflow tools (dashboard KPIs, inventory management,
 * test-drive booking administration, dealership settings, homepage CMS, users, and storage quota).
 */
export function registerAdminTools(server: McpServer) {
  server.registerTool(
    "admin_get_dashboard",
    {
      title: "Admin Dashboard KPIs",
      description:
        "Get key performance indicators: inventory breakdown (available, sold, unavailable), test drive statistics by status, and overall lead conversion rate.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await getDashboardData();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_list_cars",
    {
      title: "Admin List Cars",
      description:
        "List all cars in inventory across all statuses (AVAILABLE, SOLD, UNAVAILABLE) without pagination.",
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe(
            "Search term matching model, description, make, color, or number plate",
          ),
      }),
    },
    async ({ search }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await getCars(search);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_list_makes_and_colors",
    {
      title: "Admin List Makes and Colors",
      description:
        "Fetch all available car makes and colors from the database for metadata and vehicle updates.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      try {
        requireAdmin(ctx);
        const [makesRes, colorsRes] = await Promise.all([
          getCarMakes(),
          getCarColors(),
        ]);
        if (!makesRes.success) return formatActionResult(makesRes);
        if (!colorsRes.success) return formatActionResult(colorsRes);
        return formatToolResponse({
          makes: makesRes.data,
          colors: colorsRes.data,
        });
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_car_status",
    {
      title: "Admin Update Car Status",
      description:
        "Quickly update a car's status (AVAILABLE, UNAVAILABLE, SOLD) or featured showcase flag.",
      inputSchema: z.object({
        carId: z.string().describe("The ID of the car to update"),
        status: z
          .enum(["AVAILABLE", "UNAVAILABLE", "SOLD"])
          .optional()
          .describe("New inventory status"),
        featured: z
          .boolean()
          .optional()
          .describe("Whether to showcase car as featured on homepage"),
      }),
    },
    async ({ carId, status, featured }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await updateCarStatus(carId, {
          status: status as CarStatus | undefined,
          featured,
        });
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_car",
    {
      title: "Admin Update Car Details",
      description:
        "Update full vehicle metadata for an existing car listing while preserving existing images.",
      inputSchema: z.object({
        carId: z.string().describe("The unique ID of the car to update"),
        carData: z.object({
          carMakeId: z.string().min(1, "Make ID is required"),
          carColorId: z.string().min(1, "Color ID is required"),
          model: z.string().min(1, "Model is required"),
          year: z
            .union([z.string(), z.number()])
            .transform((v) => String(v))
            .describe("Model year (e.g. 2024)"),
          price: z
            .union([z.string(), z.number()])
            .transform((v) => String(v))
            .describe("Price in EUR"),
          mileage: z
            .union([z.string(), z.number()])
            .transform((v) => String(v))
            .describe("Mileage in km"),
          fuelType: z.string().min(1, "Fuel type is required"),
          transmission: z.string().min(1, "Transmission is required"),
          bodyType: z.string().min(1, "Body type is required"),
          numberPlate: z.string().min(1, "Number plate is required"),
          seats: z
            .union([z.string(), z.number()])
            .optional()
            .transform((v) => (v !== undefined ? String(v) : undefined))
            .describe("Number of seats"),
          description: z
            .string()
            .min(10, "Description must be at least 10 characters"),
          status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]),
          featured: z.boolean(),
          features: z.array(z.string()).describe("List of car features"),
        }),
      }),
    },
    async ({ carId, carData }, ctx) => {
      try {
        requireAdmin(ctx);
        const formData = new FormData();
        formData.set("carId", carId);
        formData.set("carData", JSON.stringify(carData));
        const result = await updateCar(formData);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_delete_car",
    {
      title: "Admin Delete Car",
      description:
        "Permanently delete a car listing, its booked test-drives, and its image assets.",
      inputSchema: z.object({
        carId: z.string().describe("The ID of the car to delete"),
      }),
    },
    async ({ carId }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await deleteCar(carId);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_list_test_drives",
    {
      title: "Admin List Test Drives",
      description:
        "List all customer test-drive bookings with customer and car details, filtered by status or search keyword.",
      inputSchema: z.object({
        search: z
          .string()
          .optional()
          .describe("Search by user name, email, car make, or model"),
        status: z
          .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
          .optional()
          .describe("Filter by booking status"),
      }),
    },
    async ({ search, status }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await getAdminTestDrives({
          search: search ?? "",
          status: status ?? "",
        });
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_test_drive_status",
    {
      title: "Admin Update Test Drive Status",
      description:
        "Update the status of a customer's test-drive reservation (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW).",
      inputSchema: z.object({
        bookingId: z.string().describe("The ID of the booking to update"),
        status: z
          .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
          .describe("The new status to apply"),
      }),
    },
    async ({ bookingId, status }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await updateTestDriveStatus(
          bookingId,
          status as BookingStatus,
        );
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_dealership_info",
    {
      title: "Admin Update Dealership Info",
      description:
        "Update dealership contact information (name, address, email, phone, and WhatsApp).",
      inputSchema: z.object({
        dealershipId: z.string().describe("The ID of the dealership record"),
        name: z.string().min(1, "Name is required"),
        address: z.string().min(1, "Address is required"),
        email: z.string().email("Valid email required"),
        phone: z.string().min(1, "Phone is required"),
        whatsappPhone: z.string().min(1, "WhatsApp phone is required"),
      }),
    },
    async ({ dealershipId, ...data }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await updateDealershipInfo(dealershipId, data);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_save_working_hours",
    {
      title: "Admin Save Working Hours",
      description: "Replace all weekly working hours for the dealership.",
      inputSchema: z.object({
        dealershipId: z.string().describe("The ID of the dealership"),
        workingHours: z
          .array(
            z.object({
              dayOfWeek: z
                .nativeEnum(DayOfWeekEnum)
                .describe(
                  "Day of the week (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)",
                ),
              openTime: z.string().describe("Opening time (e.g. '09:00')"),
              closeTime: z.string().describe("Closing time (e.g. '18:00')"),
              isOpen: z.boolean().describe("Whether dealership is open"),
            }),
          )
          .describe("List of weekly working hours"),
      }),
    },
    async ({ dealershipId, workingHours }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await saveWorkingHours(dealershipId, workingHours);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_manage_faq",
    {
      title: "Admin Manage FAQ",
      description:
        "Add, update, delete, or reorder homepage Frequently Asked Questions.",
      inputSchema: z.discriminatedUnion("action", [
        z.object({
          action: z.literal("add"),
          question: z.string().min(1, "Question is required"),
          answer: z.string().min(1, "Answer is required"),
          order: z.number().int().optional().default(0),
        }),
        z.object({
          action: z.literal("update"),
          id: z.string().describe("FAQ ID to update"),
          question: z.string().min(1, "Question is required"),
          answer: z.string().min(1, "Answer is required"),
          order: z.number().int().optional().default(0),
        }),
        z.object({
          action: z.literal("delete"),
          id: z.string().describe("FAQ ID to delete"),
        }),
        z.object({
          action: z.literal("reorder"),
          updates: z
            .array(
              z.object({
                id: z.string(),
                order: z.number().int(),
              }),
            )
            .describe("Array of FAQ IDs and their new order sequence"),
        }),
      ]),
    },
    async (args, ctx) => {
      try {
        requireAdmin(ctx);
        if (args.action === "add") {
          const result = await addFAQ({
            question: args.question,
            answer: args.answer,
            order: args.order ?? 0,
          });
          return formatActionResult(result);
        }
        if (args.action === "update") {
          const result = await updateFAQ(args.id, {
            question: args.question,
            answer: args.answer,
            order: args.order ?? 0,
          });
          return formatActionResult(result);
        }
        if (args.action === "delete") {
          const result = await deleteFAQ(args.id);
          return formatActionResult(result);
        }
        const result = await reorderFAQs(args.updates);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_home_content",
    {
      title: "Admin Update Homepage Content",
      description:
        "Update partial marketing content, headlines, hero copy, and statistics on the homepage.",
      inputSchema: z.object({
        heroBadge: z.string().optional(),
        heroTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        heroButtonText: z.string().optional(),
        featuresTitle: z.string().optional(),
        featuresSubtitle: z.string().optional(),
        statsCarsCount: z.string().optional(),
        statsSatisfiedCustomers: z.string().optional(),
        statsYearsOfExperience: z.string().optional(),
        ctaTitle: z.string().optional(),
        ctaSubtitle: z.string().optional(),
        ctaButtonText: z.string().optional(),
      }),
    },
    async (args, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await updateHomePageContent(args);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_list_users",
    {
      title: "Admin List Users",
      description:
        "List all registered application users, their roles, emails, and profile details.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await getUsers();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_update_user_role",
    {
      title: "Admin Update User Role",
      description:
        "Promote or demote a user's role (USER or ADMIN). Admins cannot change their own role.",
      inputSchema: z.object({
        userId: z.string().describe("User ID to update"),
        role: z.enum(["USER", "ADMIN"]).describe("Target role for the user"),
      }),
    },
    async ({ userId, role }, ctx) => {
      try {
        requireAdmin(ctx);
        const result = await updateUserRole(userId, role as UserRole);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "admin_get_storage_quota",
    {
      title: "Admin Get Storage Quota",
      description:
        "Inspect global Supabase storage bucket consumption (used bytes, limit bytes, and allowance).",
      inputSchema: z.object({
        incomingBytes: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe(
            "Optional byte size of a pending upload to test against limit",
          ),
      }),
    },
    async ({ incomingBytes = 0 }, ctx) => {
      try {
        requireAdmin(ctx);
        const quota = await checkStorageQuota(incomingBytes);
        return formatToolResponse(quota);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );
}
