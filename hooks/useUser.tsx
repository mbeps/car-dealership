import { createContext, useContext, useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { User as UserDetails } from "@/types/user/user";
import {
  useSessionContext,
  useSupabaseUser,
} from "@/providers/SupabaseProvider";

type UserContextType = {
  accessToken: string | null;
  user: SupabaseUser | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
};

/**
 * Context exposing authenticated user data.
 * Resolves to undefined when accessed outside of {@link MyUserContextProvider}.
 */
export const UserContext = createContext<UserContextType | undefined>(
  undefined,
);

/**
 * Props for {@link MyUserContextProvider}.
 * Accepts children and forwards any extra props to the provider element.
 */
export interface Props {
  children?: React.ReactNode;
  [propName: string]: unknown;
}

/**
 * Provider that supplies authenticated user data via {@link UserContext}.
 * Fetches user details from the "User" table when signed in and
 * clears them when the user signs out.
 *
 * @param props - Children and any extra props forwarded to the provider
 * @returns The user context provider
 */
export const MyUserContextProvider = (props: Props) => {
  const {
    session,
    isLoading: isLoadingUser,
    supabaseClient: supabase,
  } = useSessionContext();
  const user = useSupabaseUser(); // get logged in user (remapped name to avoid conflict)
  const accessToken = session?.access_token ?? null; // get access token
  const [isLoadingData, setIsLoadingData] = useState(false); // loading state for user details
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null); // user details

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

/**
 * Returns the user context value.
 * Throws when used outside of {@link MyUserContextProvider}.
 *
 * @returns Access token, Supabase user, user details, and loading state
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(`useUser must be used within a MyUserContextProvider.`);
  }
  return context;
};
