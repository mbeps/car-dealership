"use client";

import React from "react";
import { Button } from "./ui/button";
import { Heart, CarFront, Layout, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth, SignedIn, SignedOut } from "@/lib/auth-context";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderClientProps {
  isAdminPage?: boolean;
  userRole?: UserRole | null;
}

const HeaderClient = ({
  isAdminPage = false,
  userRole = null,
}: HeaderClientProps) => {
  const { user, signOut, openSignInModal } = useAuth();
  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href={isAdminPage ? ROUTES.ADMIN : ROUTES.HOME}
          className="flex items-center gap-2"
        >
          <Image
            src={"/logo.png"}
            alt="Site Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
          {isAdminPage && <span className="text-lg font-bold">Admin</span>}
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {isAdminPage ? (
            <>
              <Link href={ROUTES.HOME}>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft size={18} />
                  <span>Back to App</span>
                </Button>
              </Link>
            </>
          ) : (
            <SignedIn>
              {!isAdmin && (
                <Link
                  href={ROUTES.RESERVATIONS}
                  className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
                >
                  <Button variant="outline">
                    <CarFront size={18} />
                    <span className="hidden md:inline">My Reservations</span>
                  </Button>
                </Link>
              )}
              <Link href={ROUTES.SAVED_CARS}>
                <Button className="flex items-center gap-2">
                  <Heart size={18} />
                  <span className="hidden md:inline">Saved Cars</span>
                </Button>
              </Link>
              {isAdmin && (
                <Link href={ROUTES.ADMIN}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Layout size={18} />
                    <span className="hidden md:inline">Admin Portal</span>
                  </Button>
                </Link>
              )}
            </SignedIn>
          )}

          <SignedOut>
            {!isAdminPage && (
              <Button variant="outline" onClick={() => openSignInModal()}>
                Login
              </Button>
            )}
          </SignedOut>

          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user?.user_metadata?.avatar_url ||
                  user?.user_metadata?.picture ? (
                    <Image
                      src={
                        user.user_metadata.avatar_url ||
                        user.user_metadata.picture
                      }
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
                <div className="px-2 py-1.5 text-xs text-gray-500">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default HeaderClient;
