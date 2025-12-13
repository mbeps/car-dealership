import { formatCurrency, serializeCarData } from "@/lib/helpers";

describe("serializeCarData", () => {
  it("normalizes nested relations and string-based numeric fields", () => {
    const result = serializeCarData(
      {
        id: "car-1",
        carMake: { id: "make-1", name: "Tesla" },
        carColor: { id: "color-1", name: "Red" },
        price: "25000.50",
        mileage: "15000",
        year: "2022",
        seats: "5",
        createdAt: new Date("2024-01-01T12:00:00Z"),
        updatedAt: new Date("2024-01-02T12:00:00Z"),
      },
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
    expect((result as any).carMake).toBeUndefined();
    expect((result as any).carColor).toBeUndefined();
  });

  it("prefers top-level fields and defaults wishlisted when not provided", () => {
    const result = serializeCarData({
      id: "car-2",
      carMakeId: "make-2",
      carColorId: "color-2",
      make: "BMW",
      color: "Black",
      price: 32000,
      mileage: 8000,
      year: 2023,
      seats: 4,
      createdAt: "2023-02-01T00:00:00.000Z",
      updatedAt: "2023-03-01T00:00:00.000Z",
    });

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
      price: 10000,
      mileage: 5000,
      year: 2020,
      seats: undefined,
      wishlisted: true,
      createdAt: "2022-01-01T00:00:00.000Z",
      updatedAt: "2022-01-02T00:00:00.000Z",
    });

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
