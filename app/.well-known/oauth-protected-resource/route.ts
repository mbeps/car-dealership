import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { env } from "@/config/env";

const handler = protectedResourceHandler({
  authServerUrls: [`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`],
});

const corsOptionsHandler = metadataCorsOptionsRequestHandler();

export { corsOptionsHandler as OPTIONS, handler as GET };
