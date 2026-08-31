"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSiteUrl } from "@/lib/site-url";
import { createBrowserClient } from "@/lib/supabase/supabase-client";

/**
 * Optional callbacks and navigation targets for the sign-in hook.
 */
interface UseSignInOptions {
  onSuccess?: () => void;
  redirectUrl?: string;
}

/**
 * Handles email, Google OAuth, and passkey sign-in flows.
 * Manages Supabase auth state, loading, and success/error feedback.
 *
 * @param options - Optional success callback and redirect target
 * @returns Sign-in helpers, loading state, and auth feedback
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
