import { formatCurrency, serializeCarData } from "@/lib/helpers";
import type { RawSupabaseCar } from "@/types";
import { CarStatusEnum } from "@/types";

describe("serializeCarData", () => {
  it("normalizes nested relations and string-based numeric fields", () => {
    const result = serializeCarData(
      {
        id: "car-1",
        carMake: {
          id: "make-1",
          name: "Tesla",
          slug: "tesla",
          country: null,
          createdAt: "",
          updatedAt: "",
        },
        carColor: {
          id: "color-1",
          name: "Red",
          slug: "red",
          createdAt: "",
          updatedAt: "",
        },
        price: "25000.50",
        mileage: "15000",
        year: "2022",
        seats: "5",
        createdAt: new Date("2024-01-01T12:00:00Z"),
        updatedAt: new Date("2024-01-02T12:00:00Z"),
      } as unknown as RawSupabaseCar,
      true
    );

    expect(result).toMatchObject({
      id: "car-1",
      carMakeId: "make-1",
      make: "Tesla",
      carColorId: "color-1",
      color: "Red",
      price: 25000.5,
      mileage: 15000,
      year: 2022,
      seats: 5,
      wishlisted: true,
    });
    expect(result.createdAt).toBe("2024-01-01T12:00:00.000Z");
    expect(result.updatedAt).toBe("2024-01-02T12:00:00.000Z");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).carMake).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).carColor).toBeUndefined();
  });

  it("prefers top-level fields and defaults wishlisted when not provided", () => {
    const result = serializeCarData({
      id: "car-2",
      carMakeId: "make-2",
      carColorId: "color-2",
      make: "BMW",
      model: "X5",
      color: "Black",
      price: 32000,
      mileage: 8000,
      year: 2023,
      seats: 4,
      fuelType: "Petrol",
      transmission: "Automatic",
      bodyType: "SUV",
      numberPlate: "ABC123",
      description: "Test car",
      status: CarStatusEnum.AVAILABLE,
      featured: false,
      features: [],
      images: [],
      createdAt: "2023-02-01T00:00:00.000Z",
      updatedAt: "2023-03-01T00:00:00.000Z",
    } as RawSupabaseCar);

    expect(result).toMatchObject({
      carMakeId: "make-2",
      make: "BMW",
      carColorId: "color-2",
      color: "Black",
      wishlisted: false,
    });
    expect(result.createdAt).toBe("2023-02-01T00:00:00.000Z");
    expect(result.updatedAt).toBe("2023-03-01T00:00:00.000Z");
  });

  it("falls back to empty strings when relations and ids are missing and preserves stored wishlist flag", () => {
    const result = serializeCarData({
      id: "car-3",
      carMakeId: "",
      carColorId: "",
      model: "Model",
      fuelType: "Petrol",
      transmission: "Manual",
      bodyType: "Sedan",
      numberPlate: "XYZ789",
      description: "",
      status: CarStatusEnum.AVAILABLE,
      featured: false,
      features: [],
      images: [],
      price: 10000,
      mileage: 5000,
      year: 2020,
      seats: undefined,
      wishlisted: true,
      createdAt: "2022-01-01T00:00:00.000Z",
      updatedAt: "2022-01-02T00:00:00.000Z",
    } as unknown as RawSupabaseCar);

    expect(result).toMatchObject({
      carMakeId: "",
      make: "",
      carColorId: "",
      color: "",
      wishlisted: true,
      seats: undefined,
    });
  });
});

describe("formatCurrency", () => {
  it("formats numbers as GBP without decimals", () => {
    expect(formatCurrency(25000)).toBe("£25,000");
    expect(formatCurrency(19999.99)).toBe("£20,000");
  });
});
