"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";

interface UserMenuProps {
  user: User | null;
  isAuthenticated: boolean;
  onSignOut: () => void;
  onOpenSignIn: () => void;
  showSignInButton?: boolean;
}

/*
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
 * @author Maruf Bepary
 */
export const UserMenu = ({
  user,
  isAuthenticated,
  onSignOut,
  onOpenSignIn,
  showSignInButton = true,
}: UserMenuProps) => {
  if (!isAuthenticated) {
    return showSignInButton ? (
      <Button variant="default" onClick={onOpenSignIn}>
        Login
      </Button>
    ) : null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
            <Image
              src={user.user_metadata.avatar_url || user.user_metadata.picture}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium">
          {user?.user_metadata?.full_name || user?.email}
        </div>
        <div className="px-2 py-1.5 text-xs text-gray-500">{user?.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
