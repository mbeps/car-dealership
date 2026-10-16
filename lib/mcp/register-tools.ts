import type { McpServer } from "@modelcontextprotocol/server";
import { registerAdminTools } from "@/lib/mcp/tools/admin";
import { registerPublicTools } from "@/lib/mcp/tools/public";
import { registerUserTools } from "@/lib/mcp/tools/user";

/**
 * Registers all application MCP tools onto the provided McpServer instance.
 *
 * @param server - The McpServer instance
 */
export function registerAllTools(server: McpServer) {
  registerPublicTools(server);
  registerUserTools(server);
  registerAdminTools(server);
}
