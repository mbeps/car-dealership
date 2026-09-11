/**
 * Structured application telemetry and logging configuration using LogTape.
 *
 * Enforces a strict, fixed-width columnar console layout with ANSI colors,
 * environment-driven log levels (`LOG_LEVEL`), and runtime-aware console sinks
 * (non-blocking in production runtime, synchronous in test runners).
 *
 * @author Maruf Bepary
 */

import {
  configureSync,
  getAnsiColorFormatter,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  type LogLevel,
} from "@logtape/logtape";
import { env } from "@/lib/env";

let initialized = false;

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/**
 * ANSI console formatter with fixed-width columns, level padding, and subtle delimiters.
 *
 * Computes level padding against unformatted level names to prevent ANSI escape sequences
 * from distorting column alignment. Category segments are joined with middle dots (`·`)
 * and padded to 24 characters.
 *
 * @returns Formatted log line with fixed columnar layout.
 * @author Maruf Bepary
 */
export const consoleFormatter = getAnsiColorFormatter({
  timestamp: "time",
  level: "FULL",
  categoryStyle: "dim",
  timestampStyle: "dim",
  format({ timestamp, level, category, message, record }) {
    // 1. Join category parts with a middle dot and pad to 24 characters
    const rawCategory = record.category.join("·");
    const padLength = Math.max(0, 24 - rawCategory.length);
    const paddedCategory = category + " ".repeat(padLength);

    // 2. Pad level string to 7 characters (longest is "WARNING")
    // Use record.level (unformatted string) to calculate padding, ignoring ANSI escape sequences
    const levelStr = record.level.toUpperCase();
    const levelPad = " ".repeat(Math.max(0, 7 - levelStr.length));

    // 3. Assemble aligned row
    return `${timestamp}  ${level}${levelPad}  ${paddedCategory}  ${DIM}│${RESET}  ${message}`;
  },
});

/**
 * Synchronously initializes the LogTape logging system with environment-aware sinks.
 *
 * Configures a non-blocking console sink in web runtimes to avoid stalling HTTP requests,
 * and a synchronous sink during test runs (`NODE_ENV === "test"` or `VITEST`) to avoid
 * worker teardown races. Suppresses internal LogTape meta notices (`lowestLevel: "warning"`).
 * Safe to call multiple times; subsequent calls are idempotent no-ops.
 *
 * @author Maruf Bepary
 */
export function configureLoggingSync(): void {
  if (initialized) return;

  const isTest =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST));

  try {
    configureSync({
      sinks: {
        console: getConsoleSink({
          formatter: consoleFormatter,
          // Non-blocking in runtime to never stall requests; synchronous in tests to avoid runner teardown races
          nonBlocking: !isTest,
        }),
      },
      loggers: [
        // Silence LogTape internal meta logger diagnostic notice
        {
          category: ["logtape", "meta"],
          lowestLevel: "warning",
          sinks: ["console"],
        },
        // Root application logger
        {
          category: ["app"],
          lowestLevel: (env.LOG_LEVEL || "info") as LogLevel,
          sinks: ["console"],
        },
      ],
    });
    initialized = true;
  } catch {
    initialized = true;
  }
}

/**
 * Asynchronous initialization hook for LogTape logging.
 *
 * Provides an async entry point compatible with Next.js instrumentation and
 * server initialization hooks. Delegates to {@link configureLoggingSync}.
 *
 * @returns Promise that resolves once logging configuration has run.
 * @author Maruf Bepary
 */
export async function configureLogging(): Promise<void> {
  configureLoggingSync();
}

/**
 * Retrieves a category-scoped LogTape logger instance with guaranteed initialization.
 *
 * Ensures the global logging subsystem is initialized synchronously on first access,
 * preventing lost log entries during early application bootstrap.
 *
 * @param args - LogTape category segments (e.g. `["app", "actions", "cars"]`) or logger options.
 * @returns Configured LogTape Logger instance scoped to the specified category hierarchy.
 * @see {@link configureLoggingSync} for sink and category setup
 * @author Maruf Bepary
 */
export function getLogger(
  ...args: Parameters<typeof getLogTapeLogger>
): ReturnType<typeof getLogTapeLogger> {
  if (!initialized) {
    configureLoggingSync();
  }
  return getLogTapeLogger(...args);
}
