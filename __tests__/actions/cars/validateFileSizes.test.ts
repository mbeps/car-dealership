import { describe, expect, it, vi } from "vitest";
import { validateFileSizes } from "@/actions/cars/validate-file-sizes";

vi.mock("@/config/env", () => ({
  env: {
    NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB: 5,
  },
}));

describe("validateFileSizes", () => {
  it("allows files that are within the size limit", () => {
    const validFile = new File(["test content"], "car.jpg", {
      type: "image/jpeg",
    });
    expect(() => validateFileSizes([validFile])).not.toThrow();
  });

  it("throws an error when a file exceeds the size limit", () => {
    const largeFile = new File([""], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(largeFile, "size", {
      value: 6 * 1024 * 1024, // 6MB > 5MB limit
    });

    expect(() => validateFileSizes([largeFile])).toThrow(
      /Image 1 is too large/,
    );
  });
});
