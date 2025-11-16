"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { SignInModal } from "@/components/sign-in-modal";
import { ROUTES } from "@/lib/routes";

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  openSignInModal: (redirectUrl?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signInRedirectUrl, setSignInRedirectUrl] = useState<
    string | undefined
  >();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.HOME);
  };

  const openSignInModal = (redirectUrl?: string) => {
    setSignInRedirectUrl(redirectUrl);
    setSignInModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{ user, isSignedIn: !!user, loading, signOut, openSignInModal }}
    >
      {children}
      <SignInModal
        open={signInModalOpen}
        onOpenChange={setSignInModalOpen}
        redirectUrl={signInRedirectUrl}
      />
    </AuthContext.Provider>
  );
}

/**
 * Hook to access Supabase auth state in Client Components.
 * Returns { user, loading, signOut }.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Client component that renders children only when user is signed in.
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <>{children}</> : null;
}

/**
 * Client component that renders children only when user is signed out.
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return !user ? <>{children}</> : null;
}
