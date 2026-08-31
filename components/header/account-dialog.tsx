"use client";

import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveDrawerDialog } from "@/components/ui/responsive-drawer-dialog";
import { useUser } from "@/hooks/useUser";
import { type PasskeyEntry, PasskeyManager } from "./passkey-manager";

export type { PasskeyEntry };

/**
 * Props for the passkey-aware account dialog.
 *
 * @param trigger - Optional element used to open the dialog from a parent component
 * @param open - Whether the dialog is controlled as open
 * @param onOpenChange - Callback invoked when the dialog open state changes
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
 * Displays account details and manages passkeys in a responsive modal.
 * Fetches profile data from the user hook and delegates passkey operations to PasskeyManager.
 *
 * @param trigger - Optional element to trigger the dialog if not controlled from parent
 * @param open - Whether the dialog is controlled as open
 * @param onOpenChange - Callback to update the open state
 * @returns Account dialog with passkey management
 * @see useUser for data fetching logic
 * @see PasskeyManager for passkey row and lifecycle management
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
            <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-base">{displayName}</span>
                <span className="text-muted-foreground text-xs">
                  {userDetails?.email || user?.email || "N/A"}
                </span>
              </div>
            </div>

            {user && <PasskeyManager userId={user.id} />}
          </>
        )}
      </div>
    </ResponsiveDrawerDialog>
  );
}
