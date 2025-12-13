import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("p-2", "text-sm", { hidden: false, "text-lg": true })).toBe(
      "p-2 text-lg"
    );
    expect(cn("bg-red-500", "bg-blue-500", "rounded", undefined)).toBe(
      "bg-blue-500 rounded"
    );
  });
});
