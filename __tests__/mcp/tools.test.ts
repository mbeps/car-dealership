import { McpServer } from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DayOfWeekEnum } from "@/enums/day-of-week";
import { registerAllTools } from "@/lib/mcp/register-tools";

const mocks = vi.hoisted(() => ({
  // Public
  getPublicCars: vi.fn(),
  getCarById: vi.fn(),
  getCarFilters: vi.fn(),
  getFeaturedCars: vi.fn(),
  getDealershipInfo: vi.fn(),
  getHomePageContent: vi.fn(),
  getFAQs: vi.fn(),

  // User
  getSavedCars: vi.fn(),
  toggleSavedCar: vi.fn(),
  getUserTestDrives: vi.fn(),
  bookTestDrive: vi.fn(),
  cancelTestDrive: vi.fn(),

  // Admin
  getDashboardData: vi.fn(),
  getAdminCars: vi.fn(),
  getCarMakes: vi.fn(),
  getCarColors: vi.fn(),
  updateCarStatus: vi.fn(),
  updateCar: vi.fn(),
  deleteCar: vi.fn(),
  getAdminTestDrives: vi.fn(),
  updateTestDriveStatus: vi.fn(),
  updateDealershipInfo: vi.fn(),
  saveWorkingHours: vi.fn(),
  addFAQ: vi.fn(),
  updateFAQ: vi.fn(),
  deleteFAQ: vi.fn(),
  reorderFAQs: vi.fn(),
  updateHomePageContent: vi.fn(),
  getUsers: vi.fn(),
  updateUserRole: vi.fn(),
  checkStorageQuota: vi.fn(),
}));

vi.mock("@/actions/cars/get-public-cars", () => ({
  getCars: (...args: unknown[]) => mocks.getPublicCars(...args),
}));
vi.mock("@/actions/cars/get-car-by-id", () => ({
  getCarById: (...args: unknown[]) => mocks.getCarById(...args),
}));
vi.mock("@/actions/cars/get-car-filters", () => ({
  getCarFilters: () => mocks.getCarFilters(),
}));
vi.mock("@/actions/home/get-featured-cars", () => ({
  getFeaturedCars: (...args: unknown[]) => mocks.getFeaturedCars(...args),
}));
vi.mock("@/actions/settings/get-dealership-info", () => ({
  getDealershipInfo: () => mocks.getDealershipInfo(),
}));
vi.mock("@/actions/home/get-home-page-content", () => ({
  getHomePageContent: () => mocks.getHomePageContent(),
}));
vi.mock("@/actions/home/get-faqs", () => ({
  getFAQs: () => mocks.getFAQs(),
}));

vi.mock("@/actions/cars/get-saved-cars", () => ({
  getSavedCars: () => mocks.getSavedCars(),
}));
vi.mock("@/actions/cars/toggle-saved-car", () => ({
  toggleSavedCar: (...args: unknown[]) => mocks.toggleSavedCar(...args),
}));
vi.mock("@/actions/test-drive/get-user-test-drives", () => ({
  getUserTestDrives: () => mocks.getUserTestDrives(),
}));
vi.mock("@/actions/test-drive/book-test-drive", () => ({
  bookTestDrive: (...args: unknown[]) => mocks.bookTestDrive(...args),
}));
vi.mock("@/actions/test-drive/cancel-test-drive", () => ({
  cancelTestDrive: (...args: unknown[]) => mocks.cancelTestDrive(...args),
}));

vi.mock("@/actions/admin/get-dashboard-data", () => ({
  getDashboardData: () => mocks.getDashboardData(),
}));
vi.mock("@/actions/cars/get-cars", () => ({
  getCars: (...args: unknown[]) => mocks.getAdminCars(...args),
}));
vi.mock("@/actions/cars/get-car-makes", () => ({
  getCarMakes: () => mocks.getCarMakes(),
}));
vi.mock("@/actions/cars/get-car-colors", () => ({
  getCarColors: () => mocks.getCarColors(),
}));
vi.mock("@/actions/cars/update-car-status", () => ({
  updateCarStatus: (...args: unknown[]) => mocks.updateCarStatus(...args),
}));
vi.mock("@/actions/cars/update-car", () => ({
  updateCar: (...args: unknown[]) => mocks.updateCar(...args),
}));
vi.mock("@/actions/cars/delete-car", () => ({
  deleteCar: (...args: unknown[]) => mocks.deleteCar(...args),
}));
vi.mock("@/actions/admin/get-admin-test-drives", () => ({
  getAdminTestDrives: (...args: unknown[]) => mocks.getAdminTestDrives(...args),
}));
vi.mock("@/actions/admin/update-test-drive-status", () => ({
  updateTestDriveStatus: (...args: unknown[]) =>
    mocks.updateTestDriveStatus(...args),
}));
vi.mock("@/actions/settings/update-dealership-info", () => ({
  updateDealershipInfo: (...args: unknown[]) =>
    mocks.updateDealershipInfo(...args),
}));
vi.mock("@/actions/settings/save-working-hours", () => ({
  saveWorkingHours: (...args: unknown[]) => mocks.saveWorkingHours(...args),
}));
vi.mock("@/actions/home/add-faq", () => ({
  addFAQ: (...args: unknown[]) => mocks.addFAQ(...args),
}));
vi.mock("@/actions/home/update-faq", () => ({
  updateFAQ: (...args: unknown[]) => mocks.updateFAQ(...args),
}));
vi.mock("@/actions/home/delete-faq", () => ({
  deleteFAQ: (...args: unknown[]) => mocks.deleteFAQ(...args),
}));
vi.mock("@/actions/home/reorder-faqs", () => ({
  reorderFAQs: (...args: unknown[]) => mocks.reorderFAQs(...args),
}));
vi.mock("@/actions/home/update-home-page-content", () => ({
  updateHomePageContent: (...args: unknown[]) =>
    mocks.updateHomePageContent(...args),
}));
vi.mock("@/actions/settings/get-users", () => ({
  getUsers: () => mocks.getUsers(),
}));
vi.mock("@/actions/settings/update-user-role", () => ({
  updateUserRole: (...args: unknown[]) => mocks.updateUserRole(...args),
}));
vi.mock("@/actions/storage/check-storage-quota", () => ({
  checkStorageQuota: (...args: unknown[]) => mocks.checkStorageQuota(...args),
}));

describe("MCP Tools Suite", () => {
  let server: McpServer;

  const guestCtx = {};
  const userCtx = {
    http: {
      authInfo: {
        extra: {
          authUserId: "auth-1",
          userId: "user-1",
          email: "user@example.com",
          role: "USER",
        },
      },
    },
  };
  const adminCtx = {
    http: {
      authInfo: {
        extra: {
          authUserId: "auth-2",
          userId: "admin-1",
          email: "admin@example.com",
          role: "ADMIN",
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: "test-marketplace", version: "1.0.0" });
    registerAllTools(server);
  });

  const callTool = (
    name: string,
    args: Record<string, unknown> = {},
    ctx: unknown = guestCtx,
  ) => {
    const registered = (server as any)._registeredTools;
    const tool = registered.get ? registered.get(name) : registered[name];
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool.handler(args, ctx);
  };

  describe("Public Tools (Guest, User & Admin)", () => {
    it("search_cars normalizes make and color slugs and returns cars", async () => {
      mocks.getPublicCars.mockResolvedValue({
        success: true,
        data: { cars: [{ id: "c1" }], pagination: { total: 1 } },
      });

      const res = await callTool("search_cars", {
        make: "Aston Martin",
        color: " Midnight Blue ",
      });

      expect(res.isError).toBeUndefined();
      expect(mocks.getPublicCars).toHaveBeenCalledWith(
        expect.objectContaining({
          make: "aston-martin",
          color: "midnight-blue",
        }),
      );
    });

    it("get_car_details calls getCarById", async () => {
      mocks.getCarById.mockResolvedValue({
        success: true,
        data: { id: "c1", model: "Taycan" },
      });

      const res = await callTool("get_car_details", { carId: "c1" });
      expect(res.isError).toBeUndefined();
      expect(mocks.getCarById).toHaveBeenCalledWith("c1");
    });

    it("get_car_filters calls getCarFilters", async () => {
      mocks.getCarFilters.mockResolvedValue({
        success: true,
        data: { makes: [] },
      });

      const res = await callTool("get_car_filters");
      expect(res.isError).toBeUndefined();
      expect(mocks.getCarFilters).toHaveBeenCalled();
    });

    it("get_featured_cars calls getFeaturedCars with limit", async () => {
      mocks.getFeaturedCars.mockResolvedValue([{ id: "feat-1" }]);

      const res = await callTool("get_featured_cars", { limit: 5 });
      expect(res.isError).toBeUndefined();
      expect(mocks.getFeaturedCars).toHaveBeenCalledWith(5);
    });

    it("get_dealership_info calls getDealershipInfo", async () => {
      mocks.getDealershipInfo.mockResolvedValue({
        success: true,
        data: { name: "Prime Dealership" },
      });

      const res = await callTool("get_dealership_info");
      expect(res.isError).toBeUndefined();
      expect(mocks.getDealershipInfo).toHaveBeenCalled();
    });

    it("get_home_content calls getHomePageContent and getFAQs", async () => {
      mocks.getHomePageContent.mockResolvedValue({ heroTitle: "Welcome" });
      mocks.getFAQs.mockResolvedValue([{ id: "f1", question: "Q?" }]);

      const res = await callTool("get_home_content");
      expect(res.isError).toBeUndefined();
      expect(mocks.getHomePageContent).toHaveBeenCalled();
      expect(mocks.getFAQs).toHaveBeenCalled();
    });
  });

  describe("User Tools (Auth Required)", () => {
    it("get_auth_status returns guest status for unauthenticated caller", async () => {
      const res = await callTool("get_auth_status", {}, guestCtx);
      expect(res.isError).toBeUndefined();
      expect(res.content[0].text).toContain('"role": "GUEST"');
    });

    it("get_auth_status returns authenticated role for user and admin", async () => {
      const userRes = await callTool("get_auth_status", {}, userCtx);
      expect(userRes.content[0].text).toContain('"role": "USER"');

      const adminRes = await callTool("get_auth_status", {}, adminCtx);
      expect(adminRes.content[0].text).toContain('"role": "ADMIN"');
    });

    it("list_saved_cars denies guest and allows user", async () => {
      const guestRes = await callTool("list_saved_cars", {}, guestCtx);
      expect(guestRes.isError).toBe(true);
      expect(guestRes.content[0].text).toContain("Unauthorized");

      mocks.getSavedCars.mockResolvedValue({
        success: true,
        data: [{ id: "c1" }],
      });
      const userRes = await callTool("list_saved_cars", {}, userCtx);
      expect(userRes.isError).toBeUndefined();
    });

    it("toggle_saved_car denies guest and executes for user", async () => {
      const guestRes = await callTool(
        "toggle_saved_car",
        { carId: "c1" },
        guestCtx,
      );
      expect(guestRes.isError).toBe(true);

      mocks.toggleSavedCar.mockResolvedValue({
        success: true,
        data: { saved: true, message: "Added" },
      });
      const userRes = await callTool(
        "toggle_saved_car",
        { carId: "c1" },
        userCtx,
      );
      expect(userRes.isError).toBeUndefined();
      expect(mocks.toggleSavedCar).toHaveBeenCalledWith("c1");
    });

    it("list_my_test_drives denies guest and executes for user", async () => {
      const guestRes = await callTool("list_my_test_drives", {}, guestCtx);
      expect(guestRes.isError).toBe(true);

      mocks.getUserTestDrives.mockResolvedValue({
        success: true,
        data: [{ id: "b1" }],
      });
      const userRes = await callTool("list_my_test_drives", {}, userCtx);
      expect(userRes.isError).toBeUndefined();
    });

    it("book_test_drive allows regular user but blocks admin with error", async () => {
      mocks.bookTestDrive.mockResolvedValue({
        success: true,
        data: { id: "b1" },
      });
      const bookingData = {
        carId: "car-1",
        bookingDate: "2026-11-01",
        startTime: "10:00",
        endTime: "11:00",
        notes: "Test drive please",
      };

      const userRes = await callTool("book_test_drive", bookingData, userCtx);
      expect(userRes.isError).toBeUndefined();
      expect(mocks.bookTestDrive).toHaveBeenCalledWith(bookingData);

      const adminRes = await callTool("book_test_drive", bookingData, adminCtx);
      expect(adminRes.isError).toBe(true);
      expect(adminRes.content[0].text).toContain(
        "Administrators cannot book test drives",
      );
    });

    it("cancel_test_drive allows user and admin but denies guest", async () => {
      const guestRes = await callTool(
        "cancel_test_drive",
        { bookingId: "b1" },
        guestCtx,
      );
      expect(guestRes.isError).toBe(true);

      mocks.cancelTestDrive.mockResolvedValue({
        success: true,
        data: "Cancelled",
      });
      const userRes = await callTool(
        "cancel_test_drive",
        { bookingId: "b1" },
        userCtx,
      );
      expect(userRes.isError).toBeUndefined();
      expect(mocks.cancelTestDrive).toHaveBeenCalledWith("b1");
    });
  });

  describe("Admin Tools (Admin Required)", () => {
    const adminTools = [
      { name: "admin_get_dashboard", args: {} },
      { name: "admin_list_cars", args: { search: "test" } },
      { name: "admin_list_makes_and_colors", args: {} },
      {
        name: "admin_update_car_status",
        args: { carId: "c1", status: "SOLD" },
      },
      {
        name: "admin_update_car",
        args: {
          carId: "c1",
          carData: {
            carMakeId: "m1",
            carColorId: "co1",
            model: "Model S",
            year: 2024,
            price: 50000,
            mileage: 100,
            fuelType: "Electric",
            transmission: "Automatic",
            bodyType: "Sedan",
            numberPlate: "ABC1234",
            description: "A great car to drive every day.",
            status: "AVAILABLE",
            featured: true,
            features: ["GPS"],
          },
        },
      },
      { name: "admin_delete_car", args: { carId: "c1" } },
      { name: "admin_list_test_drives", args: {} },
      {
        name: "admin_update_test_drive_status",
        args: { bookingId: "b1", status: "CONFIRMED" },
      },
      {
        name: "admin_update_dealership_info",
        args: {
          dealershipId: "d1",
          name: "Name",
          address: "123 Main St",
          email: "info@dealership.com",
          phone: "123456",
          whatsappPhone: "123456",
        },
      },
      {
        name: "admin_save_working_hours",
        args: {
          dealershipId: "d1",
          workingHours: [
            {
              dayOfWeek: DayOfWeekEnum.MONDAY,
              openTime: "09:00",
              closeTime: "18:00",
              isOpen: true,
            },
          ],
        },
      },
      {
        name: "admin_manage_faq",
        args: { action: "add", question: "Q?", answer: "A!" },
      },
      {
        name: "admin_update_home_content",
        args: { heroTitle: "New Title" },
      },
      { name: "admin_list_users", args: {} },
      {
        name: "admin_update_user_role",
        args: { userId: "u1", role: "ADMIN" },
      },
      { name: "admin_get_storage_quota", args: {} },
    ];

    it.each(adminTools)(
      "rejects guest and user for $name",
      async ({ name, args }) => {
        const guestRes = await callTool(name, args, guestCtx);
        expect(guestRes.isError).toBe(true);

        const userRes = await callTool(name, args, userCtx);
        expect(userRes.isError).toBe(true);
        expect(userRes.content[0].text).toContain("Forbidden");
      },
    );

    it("admin_manage_faq executes add, update, delete, and reorder for admin", async () => {
      mocks.addFAQ.mockResolvedValue({ success: true, data: { id: "faq-1" } });
      mocks.updateFAQ.mockResolvedValue({
        success: true,
        data: { id: "faq-1" },
      });
      mocks.deleteFAQ.mockResolvedValue({ success: true, data: undefined });
      mocks.reorderFAQs.mockResolvedValue({
        success: true,
        data: [{ id: "faq-1", order: 1 }],
      });

      const addRes = await callTool(
        "admin_manage_faq",
        { action: "add", question: "New Q?", answer: "New Ans!" },
        adminCtx,
      );
      expect(addRes.isError).toBeUndefined();
      expect(mocks.addFAQ).toHaveBeenCalled();

      const updateRes = await callTool(
        "admin_manage_faq",
        {
          id: "faq-1",
          action: "update",
          question: "Updated Q?",
          answer: "Ans",
        },
        adminCtx,
      );
      expect(updateRes.isError).toBeUndefined();
      expect(mocks.updateFAQ).toHaveBeenCalled();

      const deleteRes = await callTool(
        "admin_manage_faq",
        { id: "faq-1", action: "delete" },
        adminCtx,
      );
      expect(deleteRes.isError).toBeUndefined();
      expect(mocks.deleteFAQ).toHaveBeenCalled();

      const reorderRes = await callTool(
        "admin_manage_faq",
        { action: "reorder", updates: [{ id: "faq-1", order: 2 }] },
        adminCtx,
      );
      expect(reorderRes.isError).toBeUndefined();
      expect(mocks.reorderFAQs).toHaveBeenCalled();
    });

    it("admin_update_car formats FormData and passes to updateCar", async () => {
      mocks.updateCar.mockResolvedValue({ success: true, data: null });

      const carData = {
        carMakeId: "m1",
        carColorId: "co1",
        model: "Civic",
        year: 2023,
        price: 25000,
        mileage: 15000,
        fuelType: "Petrol",
        transmission: "Manual",
        bodyType: "Sedan",
        numberPlate: "XYZ9876",
        description: "Reliable sedan in top shape.",
        status: "AVAILABLE",
        featured: false,
        features: ["Bluetooth"],
      };

      const res = await callTool(
        "admin_update_car",
        { carId: "car-99", carData },
        adminCtx,
      );

      expect(res.isError).toBeUndefined();
      expect(mocks.updateCar).toHaveBeenCalled();
      const calledFormData: FormData = mocks.updateCar.mock.calls[0][0];
      expect(calledFormData.get("carId")).toBe("car-99");
      expect(JSON.parse(calledFormData.get("carData") as string)).toMatchObject(
        {
          model: "Civic",
          year: 2023,
        },
      );
    });

    it("admin_update_user_role preserves self-demotion prevention error from action", async () => {
      mocks.updateUserRole.mockResolvedValue({
        success: false,
        error: "You cannot change your own role",
      });

      const res = await callTool(
        "admin_update_user_role",
        { userId: "admin-1", role: "USER" },
        adminCtx,
      );

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("You cannot change your own role");
    });
  });
});
