import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/helpers/get-error-message";

describe("getErrorMessage", () => {
  it("returns the message of a standard Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns the message of a TypeError", () => {
    expect(getErrorMessage(new TypeError("not a function"))).toBe(
      "not a function",
    );
  });

  it("returns generic message for strings", () => {
    expect(getErrorMessage("something broke")).toBe("Unexpected error");
  });

  it("returns generic message for null", () => {
    expect(getErrorMessage(null)).toBe("Unexpected error");
  });

  it("returns generic message for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("Unexpected error");
  });

  it("returns generic message for plain objects", () => {
    expect(getErrorMessage({ error: "x" })).toBe("Unexpected error");
  });

  it("returns generic message for numbers", () => {
    expect(getErrorMessage(42)).toBe("Unexpected error");
  });

  it("preserves empty Error messages rather than substituting", () => {
    expect(getErrorMessage(new Error(""))).toBe("");
  });
});
