"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CarFront, Heart, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/auth-context";

interface BottomNavProps {
  isAdmin?: boolean;
}

export const BottomNav = ({ isAdmin = false }: BottomNavProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const routes = [
    {
      label: "Home",
      icon: Home,
      href: ROUTES.HOME,
    },
    {
      label: "All Cars",
      icon: CarFront,
      href: ROUTES.CARS,
    },
    {
      label: "Saved",
      icon: Heart,
      href: ROUTES.SAVED_CARS,
      show: !!user,
    },
    {
      label: "Reservations",
      icon: Calendar,
      href: ROUTES.RESERVATIONS,
      show: !!user && !isAdmin,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around items-center h-16">
      {routes.map((route) => {
        if (route.show === false) return null;

        const isActive = pathname === route.href;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center text-slate-500 text-xs font-medium transition-all",
              isActive ? "text-blue-700" : "",
              "py-1 flex-1"
            )}
          >
            <route.icon
              className={cn("h-5 w-5 mb-1", isActive ? "text-blue-700" : "")}
            />
            {route.label}
          </Link>
        );
      })}
    </div>
  );
};
