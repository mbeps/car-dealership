import { env } from "@/lib/env";

const MAX_IMAGE_SIZE_MB = env.NEXT_PUBLIC_MAX_CAR_IMAGE_SIZE_MB;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Validates that all files are under the size limit.
 *
 * @param files - Array of File objects
 * @throws Error if any file exceeds the limit
 */
export function validateFileSizes(files: File[]): void {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Image ${
          i + 1
        } is too large (${sizeInMB}MB). Images must be less than ${MAX_IMAGE_SIZE_MB}MB.`,
      );
    }
  }
}
