import { describe, expect, it } from "vitest";
import {
  formatActionResult,
  formatToolResponse,
  normalizeSlug,
} from "@/lib/mcp/helpers";

describe("formatToolResponse", () => {
  it("formats string data into MCP text content", () => {
    const res = formatToolResponse("Hello MCP");
    expect(res).toEqual({
      content: [{ type: "text", text: "Hello MCP" }],
    });
  });

  it("formats structured object data as pretty JSON", () => {
    const data = { id: "123", name: "Porsche 911" };
    const res = formatToolResponse(data);
    expect(res).toEqual({
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    });
  });

  it("includes isError: true when error flag is passed", () => {
    const res = formatToolResponse({ error: "Not found" }, true);
    expect(res).toEqual({
      content: [
        { type: "text", text: JSON.stringify({ error: "Not found" }, null, 2) },
      ],
      isError: true,
    });
  });
});

describe("formatActionResult", () => {
  it("formats successful action responses", () => {
    const actionRes = { success: true, data: { count: 42 } };
    const res = formatActionResult(actionRes);
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toContain('"count": 42');
  });

  it("formats failed action responses with isError: true", () => {
    const actionRes = { success: false, error: "Database failure" };
    const res = formatActionResult(actionRes);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('"error": "Database failure"');
  });
});

describe("normalizeSlug", () => {
  it("converts natural language make/color names to kebab-case slugs", () => {
    expect(normalizeSlug("Aston Martin")).toBe("aston-martin");
    expect(normalizeSlug(" Mercedes  Benz ")).toBe("mercedes-benz");
    expect(normalizeSlug("BMW")).toBe("bmw");
    expect(normalizeSlug("Midnight-Blue")).toBe("midnight-blue");
  });

  it("handles empty or special character strings gracefully", () => {
    expect(normalizeSlug("")).toBeUndefined();
    expect(normalizeSlug("   ")).toBeUndefined();
    expect(normalizeSlug(undefined)).toBeUndefined();
    expect(normalizeSlug("---")).toBeUndefined();
    expect(normalizeSlug("!@#$%^&*()")).toBeUndefined();
  });
});
