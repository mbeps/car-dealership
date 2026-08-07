/**
 * Converts unknown errors into a safe user-facing message.
 *
 * Preserves standard Error messages while replacing unexpected values with a generic message.
 *
 * @param error - Error value to convert.
 * @returns User-facing error message.
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
