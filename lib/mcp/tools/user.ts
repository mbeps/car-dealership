import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getSavedCars } from "@/actions/cars/get-saved-cars";
import { toggleSavedCar } from "@/actions/cars/toggle-saved-car";
import { bookTestDrive } from "@/actions/test-drive/book-test-drive";
import { cancelTestDrive } from "@/actions/test-drive/cancel-test-drive";
import { getUserTestDrives } from "@/actions/test-drive/get-user-test-drives";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { getMcpAuth, requireUser } from "@/lib/mcp/auth";
import { formatActionResult, formatToolResponse } from "@/lib/mcp/helpers";

/**
 * Registers user workflow tools (auth status, wishlist, test-drive reservations).
 */
export function registerUserTools(server: McpServer) {
  server.registerTool(
    "get_auth_status",
    {
      title: "Get Authentication Status",
      description:
        "Inspect the current MCP session authentication privileges: authenticated boolean, role (GUEST, USER, or ADMIN), user ID, and email.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      const auth = getMcpAuth(ctx);
      if (!auth) {
        return formatToolResponse({
          authenticated: false,
          role: "GUEST",
        });
      }
      return formatToolResponse({
        authenticated: true,
        role: auth.role,
        userId: auth.userId,
        email: auth.email,
      });
    },
  );

  server.registerTool(
    "list_saved_cars",
    {
      title: "List Saved Cars",
      description:
        "List all cars currently saved on the authenticated user's wishlist.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      try {
        requireUser(ctx);
        const result = await getSavedCars();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "toggle_saved_car",
    {
      title: "Toggle Saved Car (Wishlist)",
      description:
        "Add or remove a car from the authenticated user's saved cars list (wishlist).",
      inputSchema: z.object({
        carId: z.string().describe("The ID of the car to save or unsave"),
      }),
    },
    async ({ carId }, ctx) => {
      try {
        requireUser(ctx);
        const result = await toggleSavedCar(carId);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "list_my_test_drives",
    {
      title: "List My Test Drives",
      description:
        "List all test-drive reservations booked by the authenticated user, ordered by date descending.",
      inputSchema: z.object({}),
    },
    async (_args, ctx) => {
      try {
        requireUser(ctx);
        const result = await getUserTestDrives();
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "book_test_drive",
    {
      title: "Book Test Drive",
      description:
        "Book a test-drive reservation for an available car. Note: Only regular users can book test drives; administrator accounts are blocked from customer bookings.",
      inputSchema: z.object({
        carId: z.string().describe("The ID of the car to test drive"),
        bookingDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
          .describe("Booking date (YYYY-MM-DD)"),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format")
          .describe("Start time (HH:MM)"),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format")
          .describe("End time (HH:MM)"),
        notes: z
          .string()
          .optional()
          .describe("Optional notes or special requests"),
      }),
    },
    async (args, ctx) => {
      try {
        const auth = requireUser(ctx);
        if (auth.role === UserRole.ADMIN) {
          return formatToolResponse(
            { error: "Administrators cannot book test drives." },
            true,
          );
        }
        const result = await bookTestDrive(args);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );

  server.registerTool(
    "cancel_test_drive",
    {
      title: "Cancel Test Drive",
      description:
        "Cancel an upcoming test-drive reservation owned by the user (or any booking if admin).",
      inputSchema: z.object({
        bookingId: z
          .string()
          .describe("The ID of the test drive booking to cancel"),
      }),
    },
    async ({ bookingId }, ctx) => {
      try {
        requireUser(ctx);
        const result = await cancelTestDrive(bookingId);
        return formatActionResult(result);
      } catch (error) {
        return formatToolResponse({ error: (error as Error).message }, true);
      }
    },
  );
}
