declare module "next/cache" {
  /**
   * Revalidates one or more tags (used by Next.js App Router revalidation API).
   * Accept either a single string tag or an array of tags.
   */
  export function revalidateTag(tag: string | string[]): void;

  /**
   * Revalidates a path. Some code passes an optional context string (e.g. "layout").
   * Keep the second parameter optional to match a variety of Next.js versions.
   */
  export function revalidatePath(path: string, context?: string): void;

  /**
   * Minimal typing for unstable_cache used in this repo.
   */
  export function unstable_cache<T extends (...args: unknown[]) => unknown>(
    fn: T,
    deps?: unknown[],
    options?: unknown
  ): T;
}
