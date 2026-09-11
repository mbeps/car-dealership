import { describe, expect, it } from "vitest";
import {
  configureLogging,
  configureLoggingSync,
  consoleFormatter,
  getLogger,
} from "@/lib/logger";

describe("lib/logger", () => {
  it("returns a LogTape logger instance with standard logging methods", () => {
    const logger = getLogger(["app", "test"]);

    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.fatal).toBe("function");
  });

  it("supports multiple subcategory parts joined in hierarchy", () => {
    const logger = getLogger(["app", "actions", "cars"]);
    expect(logger.category).toEqual(["app", "actions", "cars"]);
  });

  it("is idempotent when calling configureLoggingSync and configureLogging multiple times", async () => {
    expect(() => configureLoggingSync()).not.toThrow();
    await expect(configureLogging()).resolves.toBeUndefined();
  });

  describe("consoleFormatter", () => {
    it("formats records with middle-dot separated categories, aligned levels, and vertical delimiter", () => {
      const record = {
        category: ["app", "actions", "song"],
        level: "info" as const,
        message: ["Song created successfully"],
        rawMessage: "Song created successfully",
        timestamp: Date.now(),
        properties: {},
      };

      const formatted = consoleFormatter(record);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe("string");

      // Verify category middle dot joining
      expect(formatted).toContain("app·actions·song");

      // Verify delimiter presence
      expect(formatted).toContain("│");

      // Verify message presence
      expect(formatted).toContain("Song created successfully");
    });

    it("pads category to 24 characters and level to 7 characters", () => {
      const shortRecord = {
        category: ["app"],
        level: "warn" as const,
        message: ["Warning message"],
        rawMessage: "Warning message",
        timestamp: Date.now(),
        properties: {},
      };

      const formatted = consoleFormatter(shortRecord);
      expect(formatted).toContain("app");
      expect(formatted).toContain("Warning message");
      expect(formatted).toContain("│");
    });
  });

  it("allows logging messages without throwing", () => {
    const logger = getLogger(["app", "actions", "test"]);
    expect(() => {
      logger.debug("Debug test trace: {traceId}", { traceId: "abc-123" });
      logger.info("Info test event: {id}", { id: "item-456" });
      logger.warn("Warn validation test");
      logger.error("Error failure test");
    }).not.toThrow();
  });
});
