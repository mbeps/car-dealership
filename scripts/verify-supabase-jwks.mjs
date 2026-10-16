import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !publishableKey || !secretKey) {
  console.error(
    "Missing required environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY are set.",
  );
  process.exit(1);
}

function base64URLEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function checkJwks() {
  const jwksUrl = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`;
  console.log(`Checking JWKS at: ${jwksUrl}`);
  const res = await fetch(jwksUrl);
  if (!res.ok) {
    console.error(`JWKS endpoint returned HTTP ${res.status}`);
    return false;
  }
  const data = await res.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  console.log(
    `Found ${keys.length} signing key(s) in JWKS:`,
    JSON.stringify(keys, null, 2),
  );
  return keys.length > 0;
}

async function runOAuthSimulation() {
  console.log("\nStarting full OAuth 2.1 + OIDC token exchange simulation...");

  const adminSupabase = createClient(supabaseUrl, secretKey);
  const userSupabase = createClient(supabaseUrl, publishableKey);
  const testEmail = "bepary71@gmail.com";

  // 1. Generate magic link and verify OTP for test user
  console.log(`1. Authenticating test user (${testEmail})...`);
  const { data: linkData, error: linkError } =
    await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: testEmail,
    });
  if (linkError || !linkData?.properties?.email_otp) {
    throw new Error(`Failed to generate magic link: ${linkError?.message}`);
  }

  const { data: verifyData, error: verifyError } =
    await userSupabase.auth.verifyOtp({
      email: testEmail,
      token: linkData.properties.email_otp,
      type: "email",
    });
  if (verifyError || !verifyData?.session?.access_token) {
    throw new Error(`Failed to verify OTP: ${verifyError?.message}`);
  }

  // 2. Register dynamic client with openid and offline_access
  console.log(
    "2. Registering dynamic OAuth client with openid & offline_access scopes...",
  );
  const regRes = await fetch(`${supabaseUrl}/auth/v1/oauth/clients/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
    },
    body: JSON.stringify({
      client_name: "OIDC Verification Client",
      redirect_uris: ["https://example.com/oauth/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
    }),
  });
  if (!regRes.ok) {
    throw new Error(
      `Client registration failed: ${regRes.status} ${await regRes.text()}`,
    );
  }
  const client = await regRes.json();
  console.log(`   Registered client_id: ${client.client_id}`);

  // 3. Initiate PKCE authorization
  console.log("3. Initiating PKCE authorization request...");
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(
    crypto.createHash("sha256").update(verifier).digest(),
  );
  const scope = "openid profile email offline_access";

  const authUrl = `${supabaseUrl}/auth/v1/oauth/authorize?client_id=${client.client_id}&redirect_uri=https%3A%2F%2Fexample.com%2Foauth%2Fcallback&response_type=code&scope=${encodeURIComponent(scope)}&state=teststate123&code_challenge=${challenge}&code_challenge_method=S256`;

  const authorizeRes = await fetch(authUrl, {
    redirect: "manual",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${verifyData.session.access_token}`,
    },
  });

  const consentLocation = authorizeRes.headers.get("location");
  console.log(`   Full consent location: ${consentLocation}`);
  if (!consentLocation?.includes("authorization_id=")) {
    throw new Error(
      `Authorize failed. Status: ${authorizeRes.status}, location: ${consentLocation}`,
    );
  }

  const consentUrl = new URL(consentLocation);
  const authorizationId = consentUrl.searchParams.get("authorization_id");
  console.log(`   Consent authorization_id: ${authorizationId}`);

  // 4. Fetch authorization details (which associates user with authorization) and approve
  console.log(
    "4. Fetching authorization details and approving authorization...",
  );
  const detailsRes =
    await userSupabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (detailsRes.error) {
    throw new Error(
      `getAuthorizationDetails error: ${JSON.stringify(detailsRes.error)}`,
    );
  }

  const approveRes = await userSupabase.auth.oauth.approveAuthorization(
    authorizationId,
    {
      skipBrowserRedirect: true,
    },
  );
  if (approveRes.error || !approveRes.data?.redirect_url) {
    throw new Error(`Approve error: ${JSON.stringify(approveRes.error)}`);
  }

  const finalRedirect = new URL(approveRes.data.redirect_url);
  const code = finalRedirect.searchParams.get("code");
  console.log(`   Obtained authorization code: ${code}`);

  // 5. Exchange code for tokens
  console.log("5. Exchanging code at /auth/v1/oauth/token...");
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: "https://example.com/oauth/callback",
    code_verifier: verifier,
  });

  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenParams.toString(),
  });

  const tokenData = await tokenRes.json();
  console.log(`   Token response status: ${tokenRes.status}`);

  if (!tokenRes.ok || tokenData.error) {
    console.error("   Token exchange error:", tokenData);
    return false;
  }

  console.log("   Token exchange succeeded!");
  console.log(
    "   - access_token:",
    tokenData.access_token ? "PRESENT" : "MISSING",
  );
  console.log(
    "   - refresh_token:",
    tokenData.refresh_token ? "PRESENT" : "MISSING",
  );
  console.log("   - id_token:", tokenData.id_token ? "PRESENT" : "MISSING");

  if (tokenData.id_token) {
    const payload = JSON.parse(
      Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString(
        "utf8",
      ),
    );
    console.log(
      "   Decoded ID token claims:",
      JSON.stringify(payload, null, 2),
    );
  }

  return true;
}

async function main() {
  const hasKeys = await checkJwks();
  if (!hasKeys) {
    console.log("\n[WARNING] JWKS has 0 active asymmetric signing keys.");
    console.log(
      "Action needed: Navigate to https://supabase.com/dashboard/project/jxtfkekhdoshwxjjjlhi/settings/jwt",
    );
    console.log(
      "Click 'Migrate JWT secret' and 'Rotate keys' to activate ES256 asymmetric keys.",
    );
    console.log("Once done, re-run this script to verify!\n");
    return;
  }

  const success = await runOAuthSimulation();
  if (success) {
    console.log(
      "\n[SUCCESS] End-to-end OAuth 2.1 + OIDC token exchange is working flawlessly!",
    );
  } else {
    console.log("\n[FAILED] Token exchange failed. Review logs above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
