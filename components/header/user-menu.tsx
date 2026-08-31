"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "./account-dialog";

/**
 * Props for the user authentication menu.
 */
interface UserMenuProps {
  /** Current authenticated user object from Supabase. */
  user: User | null;
  /** Whether the user is currently logged in. */
  isAuthenticated: boolean;
  /** Callback function to handle user sign out. */
  onSignOut: () => void;
  /** Callback function to open sign-in modal. */
  onOpenSignIn: () => void;
  /** Whether to show login button (hidden on admin pages). */
  showSignInButton?: boolean;
}

/**
 * User authentication menu component that handles login/logout UI.
 * Shows login button for unauthenticated users or user dropdown with profile info and sign out.
 * Displays user avatar or initials with full name and email in dropdown.
 *
 * @param user - Current authenticated user object from Supabase
 * @param isAuthenticated - Whether the user is currently logged in
 * @param onSignOut - Callback function to handle user sign out
 * @param onOpenSignIn - Callback function to open sign-in modal
 * @param showSignInButton - Whether to show login button (hidden on admin pages)
 * @returns Login button or user dropdown menu based on auth state
 * @see AuthProvider - Context providing authentication state
 */
export const UserMenu = ({
  user,
  isAuthenticated,
  onSignOut,
  onOpenSignIn,
  showSignInButton = true,
}: UserMenuProps) => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  if (!isAuthenticated) {
    return showSignInButton ? (
      <Button variant="default" onClick={() => onOpenSignIn()}>
        Login
      </Button>
    ) : null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="rounded-full" />
          }
        >
          {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
            <Image
              src={user.user_metadata.avatar_url || user.user_metadata.picture}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-semibold text-white">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-xs">
          <div className="px-2 py-1.5 font-medium text-sm">
            {user?.user_metadata?.full_name || user?.email}
          </div>
          <div className="px-2 py-1.5 text-gray-500 text-xs">{user?.email}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsAccountOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={isAccountOpen} onOpenChange={setIsAccountOpen} />
    </>
  );
};
