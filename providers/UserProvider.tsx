"use client";

import { MyUserContextProvider } from "@/hooks/useUser";

/**
 * Provider props for UserProvider.
 *
 * @param children - Child components that consume user context.
 */
interface UserProviderProps {
  children: React.ReactNode;
}

/**
 * Provides user data and related functionality to all components in the tree.
 *
 * Wraps the shared user context provider so authentication and user profile state can be accessed consistently across the app.
 *
 * @param children - Child components that consume user context.
 * @returns Provider element for the application shell.
 */
const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  return <MyUserContextProvider>{children}</MyUserContextProvider>;
};

export default UserProvider;
