"use client";

import * as React from "react";
import { useUser } from "@/hooks/useUser";
import { ResponsiveDrawerDialog } from "@/components/ui/responsive-drawer-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Props for the AccountDialog component.
 *
 * @see AccountDialog for usage
 * @author Maruf Bepary
 */
interface AccountDialogProps {
  /** Optional element to trigger the dialog if not controlled from parent */
  trigger?: React.ReactNode;
  /** Whether the dialog is currently open */
  open?: boolean;
  /** Callback to update the open state */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Displays user profile information in a responsive modal.
 * Fetches data from the useUser hook and presents Name, Email, Phone, and Role.
 * Switches between Dialog and Drawer based on screen size via ResponsiveDrawerDialog.
 *
 * @param props - Control state and trigger for the account dialog
 * @returns A responsive user profile dialog
 * @see useUser for data fetching logic
 * @author Maruf Bepary
 */
export function AccountDialog({
  trigger,
  open,
  onOpenChange,
}: AccountDialogProps) {
  const { user, userDetails, isLoading } = useUser();

  const displayName =
    userDetails?.name || user?.user_metadata?.full_name || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const profileImage =
    userDetails?.imageUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  return (
    <ResponsiveDrawerDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title="Account Settings"
      description="View your profile information."
    >
      <div className="grid gap-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-base font-semibold">{displayName}</span>
                <span className="text-muted-foreground text-xs">
                  {userDetails?.role || "User"}
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              <InfoField
                label="Email"
                value={userDetails?.email || user?.email || "N/A"}
              />
              <InfoField
                label="Phone"
                value={userDetails?.phone || "Not provided"}
              />
              <InfoField label="Role" value={userDetails?.role || "User"} />
            </div>
          </>
        )}
      </div>
    </ResponsiveDrawerDialog>
  );
}

/**
 * Renders a labeled read-only information field.
 * Used for displaying profile attributes like Email, Phone, and Role.
 *
 * @param label - Descriptive label for the information
 * @param value - The actual data value to display
 * @returns A styled label-value pair
 * @author Maruf Bepary
 */
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
