import type { ActionResponse } from "@/types/common/action-response";

/**
 * Formats data into a standard MCP tool call response payload.
 *
 * @param data - The payload to serialize into text content
 * @param isError - Whether this response represents a tool error
 * @returns Standard MCP CallToolResult object
 */
export function formatToolResponse(data: unknown, isError = false) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
    ...(isError ? { isError: true } : {}),
  };
}

/**
 * Converts a standard ActionResponse<T> from a Server Action
 * into an MCP tool response.
 *
 * @param result - ActionResponse from a server action
 * @returns CallToolResult with data or error
 */
export function formatActionResult<T>(result: ActionResponse<T>) {
  if (!result.success) {
    return formatToolResponse({ error: result.error }, true);
  }
  return formatToolResponse(result.data);
}

/**
 * Normalizes user- or LLM-provided natural language names or strings
 * (e.g., "Aston Martin", " Mercedes  Benz ") into clean URL/database slugs ("aston-martin", "mercedes-benz").
 *
 * @param input - Natural-language or formatted string
 * @returns Kebab-case slug or undefined if empty
 */
export function normalizeSlug(input?: string): string | undefined {
  if (!input) return undefined;
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : undefined;
}
