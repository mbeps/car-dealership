"use client";

import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/config/routes";
import { createBrowserClient } from "@/lib/supabase/supabase-client";

export type OAuthConsentStatus =
  | "loading"
  | "ready"
  | "submitting"
  | "redirecting"
  | "error";

export type OAuthConsentAction = "approve" | "deny" | null;

export interface UseOAuthConsentOptions {
  authorizationId: string | null;
}

export function useOAuthConsent({ authorizationId }: UseOAuthConsentOptions) {
  const router = useRouter();
  const [status, setStatus] = useState<OAuthConsentStatus>("loading");
  const [actionType, setActionType] = useState<OAuthConsentAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(
    null,
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      if (!authorizationId) {
        if (isMounted) {
          setStatus("error");
          setError(
            "No authorization ID provided. Please connect to this MCP server from an authorized application like Google Gemini or Claude.",
          );
        }
        return;
      }

      try {
        const supabase = createBrowserClient();
        const userRes = await supabase.auth.getUser();
        const user = userRes?.data?.user;

        if (!isMounted) return;

        if (!user) {
          const returnUrl = `${ROUTES.AUTH.OAUTH_CONSENT}?authorization_id=${encodeURIComponent(authorizationId)}`;
          router.push(
            `${ROUTES.AUTH.SIGN_IN}?redirect=${encodeURIComponent(returnUrl)}`,
          );
          return;
        }

        setUserEmail(user.email ?? null);

        const authDetailsRes =
          await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
        const authData = authDetailsRes?.data;
        const authError = authDetailsRes?.error;

        if (!isMounted) return;

        if (authError || !authData) {
          setStatus("error");
          setError(
            authError?.message ||
              "Failed to load authorization request. It may have expired or already been completed.",
          );
          return;
        }

        // If user already granted consent, redirect immediately without rendering consent form
        if ("redirect_url" in authData) {
          setStatus("redirecting");
          window.location.assign(authData.redirect_url);
          return;
        }

        // Needs consent
        setDetails(authData);
        setStatus("ready");
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading authorization details.",
        );
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [authorizationId, router]);

  const handleApprove = async () => {
    if (!authorizationId) return;

    setStatus("submitting");
    setActionType("approve");
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data, error: approveError } =
        await supabase.auth.oauth.approveAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        });

      if (approveError || !data?.redirect_url) {
        setStatus("ready");
        setActionType(null);
        setError(
          approveError?.message || "Failed to approve authorization request.",
        );
        return;
      }

      setStatus("redirecting");
      window.location.assign(data.redirect_url);
    } catch (err) {
      setStatus("ready");
      setActionType(null);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during approval.",
      );
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;

    setStatus("submitting");
    setActionType("deny");
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data, error: denyError } =
        await supabase.auth.oauth.denyAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        });

      if (denyError || !data?.redirect_url) {
        setStatus("ready");
        setActionType(null);
        setError(
          denyError?.message || "Failed to reject authorization request.",
        );
        return;
      }

      setStatus("redirecting");
      window.location.assign(data.redirect_url);
    } catch (err) {
      setStatus("ready");
      setActionType(null);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while rejecting request.",
      );
    }
  };

  return {
    status,
    actionType,
    error,
    details,
    userEmail,
    handleApprove,
    handleDeny,
  };
}
