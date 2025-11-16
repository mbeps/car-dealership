"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "sonner";

interface UseSignInOptions {
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function useSignIn(options?: UseSignInOptions) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      toast.success("Signed in successfully!");

      if (options?.onSuccess) {
        options.onSuccess();
      }

      if (options?.redirectUrl) {
        router.push(options.redirectUrl);
      }

      router.refresh();
      return { success: true };
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectTo = options?.redirectUrl || window.location.pathname;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
      return { success: false, error };
    }
  };

  return {
    loading,
    signInWithEmail,
    signInWithGoogle,
  };
}
