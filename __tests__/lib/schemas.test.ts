import {
  carFormSchema,
  dealershipInfoSchema,
  forgotPasswordSchema,
  testDriveSchema,
  updatePasswordSchema,
} from "@/lib/schemas";
import { CarStatusEnum } from "@/enums/car-status";

const baseCarFormData = {
  carMakeId: "make-1",
  carColorId: "color-1",
  model: "Model S",
  year: "2024",
  price: "55000",
  mileage: "12000",
  fuelType: "Electric",
  transmission: "Automatic",
  bodyType: "Sedan",
  numberPlate: "AB12CDE",
  seats: "5",
  description: "A fast electric sedan with autopilot capabilities.",
  status: CarStatusEnum.AVAILABLE,
  featured: true,
  features: ["Autopilot", "Panoramic Roof"],
};

describe("testDriveSchema", () => {
  it("requires date and time slot", () => {
    const result = testDriveSchema.safeParse({
      timeSlot: "10:00",
    } as unknown);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Please select a date for your test drive"
      );
    }
  });

  it("parses valid data", () => {
    const date = new Date("2024-03-10T00:00:00Z");
    const result = testDriveSchema.parse({ date, timeSlot: "14:00" });

    expect(result).toEqual({ date, timeSlot: "14:00", notes: undefined });
  });
});

describe("carFormSchema", () => {
  it("accepts valid car data", () => {
    const parsed = carFormSchema.parse(baseCarFormData);
    expect(parsed.model).toBe("Model S");
    expect(parsed.features).toEqual(["Autopilot", "Panoramic Roof"]);
  });

  it("rejects invalid year and price", () => {
    const result = carFormSchema.safeParse({
      ...baseCarFormData,
      year: "1899",
      price: "-1000",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toEqual(
        expect.arrayContaining([
          "Valid year required",
          "Price must be a valid number greater than 0",
        ])
      );
    }
  });

  it("rejects invalid number plate format", () => {
    const result = carFormSchema.safeParse({
      ...baseCarFormData,
      numberPlate: "ab-12",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Number plate must be 2-10 uppercase letters")
        )
      ).toBe(true);
    }
  });

  it("allows seats to be omitted and applies defaults", () => {
    const result = carFormSchema.parse({
      ...baseCarFormData,
      seats: undefined,
      features: undefined,
      featured: undefined,
    });

    expect(result.seats).toBeUndefined();
    expect(result.features).toEqual([]);
    expect(result.featured).toBe(false);
  });
});

describe("dealershipInfoSchema", () => {
  it("validates required fields and email format", () => {
    const result = dealershipInfoSchema.safeParse({
      name: "Prime Motors",
      address: "123 High Street",
      email: "invalid-email",
      phone: "",
      whatsappPhone: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toEqual(
        expect.arrayContaining([
          "Valid email is required",
          "Phone number is required",
          "WhatsApp number is required",
        ])
      );
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("requires valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Valid email is required");
    }
  });
});

describe("updatePasswordSchema", () => {
  it("ensures passwords match and meet length", () => {
    const result = updatePasswordSchema.safeParse({
      password: "secret1",
      confirmPassword: "secret2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });
});
