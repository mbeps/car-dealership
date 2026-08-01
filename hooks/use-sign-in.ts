"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/supabase-client";
import { getSiteUrl } from "@/lib/site-url";

interface UseSignInOptions {
  onSuccess?: () => void;
  redirectUrl?: string;
}

/**
 * Hook for email and Google OAuth sign-in.
 * Manages Supabase auth flows with loading/error states.
 * Handles redirects and success callbacks.
 *
 * @param options - Success callback and redirect URL
 * @returns Sign-in methods, loading, error, and success states
 * @see SignInModal - Component using this hook
 * @see https://supabase.com/docs/reference/javascript/auth-signinwithpassword
 */
export function useSignIn(options?: UseSignInOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient();
  const supportsPasskeys =
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      setSuccess("Signed in successfully!");

      if (options?.onSuccess) {
        options.onSuccess();
      }

      if (options?.redirectUrl) {
        router.push(options.redirectUrl);
      }

      router.refresh();
      return { success: true };
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError("");
    setSuccess("");
    try {
      const redirectTo = options?.redirectUrl || window.location.pathname;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?redirect=${redirectTo}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    }
  };

  const signInWithPasskey = async () => {
    if (!supportsPasskeys) {
      const error = new Error("Passkeys are not supported in this browser");
      setError(error.message);
      return { success: false, error };
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase.auth.signInWithPasskey();

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      setSuccess("Signed in successfully with your passkey!");

      if (options?.onSuccess) {
        options.onSuccess();
      }

      if (options?.redirectUrl) {
        router.push(options.redirectUrl);
      }

      router.refresh();
      return { success: true, data };
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const registerPasskey = async () => {
    if (!supportsPasskeys) {
      const error = new Error("Passkeys are not supported in this browser");
      setError(error.message);
      return { success: false, error };
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase.auth.registerPasskey();

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      setSuccess("Passkey added successfully.");
      return { success: true, data };
    } catch (error) {
      setError("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    supportsPasskeys,
    signInWithEmail,
    signInWithGoogle,
    signInWithPasskey,
    registerPasskey,
  };
}
