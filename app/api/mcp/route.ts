import { mcpHandler } from "@/lib/mcp/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, HEAD",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, mcp-session-id, baggage, sentry-trace",
  "Access-Control-Max-Age": "86400",
};

/**
 * Handles CORS preflight requests for browser-based MCP clients.
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Handles HEAD probe / health-check requests gracefully without 405 errors.
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Normalizes incoming POST requests before delegating to mcp-handler.
 * Avoids 415 Unsupported Media Type if automated client probes or gateways
 * omit the Content-Type header or send plain text.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type");
  const accept = req.headers.get("accept");

  let requestToHandle = req;
  const needsContentType =
    !contentType ||
    contentType.trim() === "" ||
    !contentType.toLowerCase().includes("application/json");
  const needsAccept = !accept || accept === "*/*" || accept.trim() === "";

  if (needsContentType || needsAccept) {
    const newHeaders = new Headers(req.headers);
    if (needsContentType) {
      newHeaders.set("content-type", "application/json");
    }
    if (needsAccept) {
      newHeaders.set("accept", "application/json, text/event-stream");
    }
    requestToHandle = new Request(req, {
      headers: newHeaders,
    });
  }

  const res = await mcpHandler(requestToHandle);

  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export async function GET(req: Request) {
  const res = await mcpHandler(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export async function DELETE(req: Request) {
  const res = await mcpHandler(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
