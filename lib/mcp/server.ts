import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { type McpAuthContext, verifyMcpToken } from "@/lib/mcp/auth";
import { registerAllTools } from "@/lib/mcp/register-tools";
import {
  createPublicClient,
  runWithMcpSupabase,
} from "@/lib/supabase/supabase";

/**
 * Underlying MCP handler that registers all domain tools.
 */
const baseHandler = createMcpHandler(
  (server) => {
    registerAllTools(server);
  },
  {
    serverInfo: {
      name: "ai-car-marketplace",
      version: "1.0.0",
    },
  },
);

/**
 * Request handler wrapped with AsyncLocalStorage to ensure
 * downstream Server Actions execute with the caller's bound Supabase client.
 */
const scopedHandler = async (req: Request): Promise<Response> => {
  const authContext = req.auth?.extra as McpAuthContext | undefined;
  const client = authContext?.supabase ?? createPublicClient();

  return runWithMcpSupabase(client, () => baseHandler(req));
};

/**
 * Main authenticated MCP route handler.
 * Optional authentication (required: false) enables Guest, User, and Admin tiers
 * over the same endpoint, while issuing RFC 9728 401 challenges on invalid Bearer tokens.
 */
export const mcpHandler = withMcpAuth(scopedHandler, verifyMcpToken, {
  required: false,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});
