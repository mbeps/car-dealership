"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Heart,
  CarFront,
  Layout,
  ArrowLeft,
  LogOut,
  Home,
  Menu,
  Calendar,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

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
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      title: "Home",
      url: ROUTES.HOME,
      icon: Home,
    },
    {
      title: "All Cars",
      url: ROUTES.CARS,
      icon: CarFront,
    },
    {
      title: "Saved Cars",
      url: ROUTES.SAVED_CARS,
      icon: Heart,
    },
    {
      title: "My Reservations",
      url: ROUTES.RESERVATIONS,
      icon: Calendar,
    },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[75vw] sm:w-[300px] p-0">
              <SheetHeader className="p-4 border-b text-left">
                <SheetTitle>Application</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.url}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
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
        </div>

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
            <>
              <Link href={ROUTES.HOME} className="hidden md:block">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home size={18} />
                  <span>Home</span>
                </Button>
              </Link>
              <Link href={ROUTES.CARS} className="hidden md:block">
                <Button variant="ghost" className="flex items-center gap-2">
                  <CarFront size={18} />
                  <span>All Cars</span>
                </Button>
              </Link>
              <SignedIn>
                {!isAdmin && (
                  <Link
                    href={ROUTES.RESERVATIONS}
                    className="text-gray-600 hover:text-blue-600 hidden md:flex items-center gap-2"
                  >
                    <Button variant="outline">
                      <CarFront size={18} />
                      <span>My Reservations</span>
                    </Button>
                  </Link>
                )}
                <Link href={ROUTES.SAVED_CARS} className="hidden md:block">
                  <Button className="flex items-center gap-2">
                    <Heart size={18} />
                    <span>Saved Cars</span>
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href={ROUTES.ADMIN} className="hidden md:block">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Layout size={18} />
                      <span>Admin Portal</span>
                    </Button>
                  </Link>
                )}
              </SignedIn>
            </>
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
