"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";
import {
  useSessionContext,
  useSupabaseUser,
} from "@/providers/supabase-provider";
import type { User as UserDetails } from "@/types/user/user";

export type UserContextType = {
  accessToken: string | null;
  user: SupabaseUser | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

export interface UserProviderProps {
  children?: React.ReactNode;
  [propName: string]: unknown;
}

/**
 * Provider that supplies authenticated user data via UserContext.
 * Fetches user details from the "User" table when signed in and
 * clears them when the user signs out.
 */
const UserProvider = (props: UserProviderProps) => {
  const {
    session,
    isLoading: isLoadingUser,
    supabaseClient: supabase,
  } = useSessionContext();
  const user = useSupabaseUser();
  const accessToken = session?.access_token ?? null;
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    if (!user) {
      if (!isLoadingUser && !isLoadingData) {
        setUserDetails(null);
      }
      return;
    }

    if (isLoadingUser || userDetails !== null) {
      return;
    }

    let isCancelled = false;

    const fetchUserDetails = async () => {
      setIsLoadingData(true);
      try {
        const { data, error } = await supabase
          .from("User")
          .select("*")
          .eq("supabaseAuthUserId", user.id)
          .single();

        if (isCancelled) {
          return;
        }

        if (error) {
          console.error("Failed to fetch user details:", error);
          return;
        }

        setUserDetails((data as UserDetails) ?? null);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch user details:", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    };

    fetchUserDetails();

    return () => {
      isCancelled = true;
    };
  }, [user, userDetails, isLoadingUser, isLoadingData, supabase]);

  const value = {
    accessToken,
    user,
    userDetails,
    isLoading: isLoadingUser || isLoadingData,
  };

  return <UserContext.Provider value={value} {...props} />;
};

export default UserProvider;
