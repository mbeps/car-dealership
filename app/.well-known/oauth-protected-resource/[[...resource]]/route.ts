import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { env } from "@/config/env";

/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata endpoint.
 * Supports both root `/.well-known/oauth-protected-resource` and path-scoped
 * queries such as `/.well-known/oauth-protected-resource/api/mcp` via optional catch-all.
 *
 * @see https://datatracker.ietf.org/doc/rfc9728/
 */
const handler = protectedResourceHandler({
  authServerUrls: [`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],
});

const corsOptionsHandler = metadataCorsOptionsRequestHandler();

export { corsOptionsHandler as OPTIONS, handler as GET };

