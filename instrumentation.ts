/**
 * Next.js server runtime instrumentation hook.
 *
 * Executes once during Next.js server initialization before request handling begins.
 * Initializes LogTape logging on the Node.js server runtime.
 *
 * @returns Promise that resolves once server-side instrumentation is complete.
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation} Next.js Instrumentation Docs
 * @author Maruf Bepary
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { configureLoggingSync } = await import("@/lib/logger");
    configureLoggingSync();
  }
}
