"use client";

import * as React from "react";
import { useUser } from "@/hooks/useUser";
import { ResponsiveDrawerDialog } from "@/components/ui/responsive-drawer-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useSignIn } from "@/hooks/use-sign-in";
import { createBrowserClient } from "@/lib/supabase/supabase-client";

/**
 * A passkey entry returned by the Supabase auth API.
 */
interface PasskeyEntry {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

/**
 * Feedback shown after a passkey create, rename, or delete action.
 */
interface PasskeyFeedback {
  type: "error" | "success";
  message: string;
}

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
 * Fetches profile data from the user hook and supports add, rename, and delete flows.
 *
 * @param props - Control state and trigger for the account dialog
 * @returns A responsive account dialog with passkey management
 * @see useUser for data fetching logic
 */
export function AccountDialog({
  trigger,
  open,
  onOpenChange,
}: AccountDialogProps) {
  const { user, userDetails, isLoading } = useUser();
  const { loading, supportsPasskeys, registerPasskey } = useSignIn();
  const [passkeys, setPasskeys] = React.useState<PasskeyEntry[]>([]);
  const [passkeysLoading, setPasskeysLoading] = React.useState(false);
  const [passkeyFeedback, setPasskeyFeedback] =
    React.useState<PasskeyFeedback | null>(null);
  const [editingPasskeyId, setEditingPasskeyId] = React.useState<string | null>(
    null,
  );
  const [draftPasskeyName, setDraftPasskeyName] = React.useState("");
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null,
  );
  const supabase = React.useMemo(() => createBrowserClient(), []);

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

  const loadPasskeys = React.useCallback(async () => {
    if (!user?.id || !supportsPasskeys) {
      setPasskeys([]);
      return;
    }

    setPasskeysLoading(true);
    setPasskeyFeedback(null);

    try {
      const { data, error } = await supabase.auth.passkey.list();

      if (error) {
        setPasskeyFeedback({
          type: "error",
          message: error.message || "Unable to load passkeys right now.",
        });
        return;
      }

      setPasskeys(data ?? []);
    } catch (error) {
      setPasskeyFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load passkeys right now.",
      });
    } finally {
      setPasskeysLoading(false);
    }
  }, [supabase, supportsPasskeys, user?.id]);

  React.useEffect(() => {
    if (!user?.id || !supportsPasskeys) {
      setPasskeys([]);
      setPasskeyFeedback(null);
      return;
    }

    void loadPasskeys();
  }, [loadPasskeys, supportsPasskeys, user?.id]);

  const handleAddPasskey = async () => {
    setPasskeyFeedback(null);
    const result = await registerPasskey();

    if (result.success) {
      setPasskeyFeedback({
        type: "success",
        message: "Passkey added successfully.",
      });
      await loadPasskeys();
      return;
    }

    setPasskeyFeedback({
      type: "error",
      message:
        result.error instanceof Error
          ? result.error.message
          : "Unable to add this passkey.",
    });
  };

  const handleRenameStart = (passkey: PasskeyEntry) => {
    setEditingPasskeyId(passkey.id);
    setDraftPasskeyName(passkey.friendly_name || "");
    setPasskeyFeedback(null);
  };

  const handleRenameSave = async (passkeyId: string) => {
    const trimmedName = draftPasskeyName.trim();

    if (!trimmedName) {
      setPasskeyFeedback({
        type: "error",
        message: "Please enter a name for this passkey.",
      });
      return;
    }

    setPendingActionId(passkeyId);

    try {
      const { data, error } = await supabase.auth.passkey.update({
        passkeyId,
        friendlyName: trimmedName,
      });

      if (error) {
        setPasskeyFeedback({
          type: "error",
          message: error.message || "Unable to rename this passkey.",
        });
        return;
      }

      setPasskeys((currentPasskeys) =>
        currentPasskeys.map((passkey) =>
          passkey.id === passkeyId
            ? { ...passkey, friendly_name: data?.friendly_name ?? trimmedName }
            : passkey,
        ),
      );
      setPasskeyFeedback({
        type: "success",
        message: "Passkey renamed successfully.",
      });
    } catch (error) {
      setPasskeyFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to rename this passkey.",
      });
    } finally {
      setPendingActionId(null);
      setEditingPasskeyId(null);
      setDraftPasskeyName("");
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    setPendingActionId(passkeyId);

    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });

      if (error) {
        setPasskeyFeedback({
          type: "error",
          message: error.message || "Unable to delete this passkey.",
        });
        return;
      }

      setPasskeys((currentPasskeys) =>
        currentPasskeys.filter((passkey) => passkey.id !== passkeyId),
      );
      setPasskeyFeedback({
        type: "success",
        message: "Passkey removed successfully.",
      });
    } catch (error) {
      setPasskeyFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete this passkey.",
      });
    } finally {
      setPendingActionId(null);
    }
  };

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
                  {userDetails?.email || user?.email || "N/A"}
                </span>
              </div>
            </div>

            {user && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Passkeys</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with a device authenticator when available.
                    </p>
                  </div>
                  {supportsPasskeys ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPasskey}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add a passkey"
                      )}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unsupported
                    </span>
                  )}
                </div>

                {passkeyFeedback && (
                  <Alert
                    variant={
                      passkeyFeedback.type === "error"
                        ? "destructive"
                        : undefined
                    }
                    className={
                      passkeyFeedback.type === "success"
                        ? "border-green-500 text-green-700"
                        : undefined
                    }
                  >
                    <AlertDescription>
                      {passkeyFeedback.message}
                    </AlertDescription>
                  </Alert>
                )}

                {supportsPasskeys ? (
                  <div className="space-y-3">
                    {passkeysLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading passkeys...
                      </div>
                    ) : passkeys.length > 0 ? (
                      <ul className="space-y-2">
                        {passkeys.map((passkey) => (
                          <PasskeyRow
                            key={passkey.id}
                            passkey={passkey}
                            isEditing={editingPasskeyId === passkey.id}
                            draftName={draftPasskeyName}
                            pending={pendingActionId === passkey.id}
                            onDraftChange={setDraftPasskeyName}
                            onEditStart={() => handleRenameStart(passkey)}
                            onEditCancel={() => {
                              setEditingPasskeyId(null);
                              setDraftPasskeyName("");
                            }}
                            onRenameSave={() => handleRenameSave(passkey.id)}
                            onDelete={() => handleDeletePasskey(passkey.id)}
                          />
                        ))}
                      </ul>
                    ) : (
                      <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                        No passkeys yet. Add one from this device to sign in
                        faster.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Passkeys are not supported in this browser. You can still
                    use email sign-in.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveDrawerDialog>
  );
}

/**
 * Renders a single passkey row with edit and delete controls.
 *
 * @param passkey - The passkey entry to display in the row
 * @param isEditing - Whether the row is in edit mode for renaming
 * @param draftName - The current draft name for the passkey
 * @param pending - Whether an action (rename/delete) is pending for this passkey
 * @param onDraftChange - Callback to update the draft name
 * @param onEditStart - Callback to initiate editing this passkey
 * @param onEditCancel - Callback to cancel editing this passkey
 * @param onRenameSave - Callback to save the renamed passkey
 * @param onDelete - Callback to delete this passkey
 * @returns A list item representing a passkey with edit and delete controls
 */
function PasskeyRow({
  passkey,
  isEditing,
  draftName,
  pending,
  onDraftChange,
  onEditStart,
  onEditCancel,
  onRenameSave,
  onDelete,
}: {
  passkey: PasskeyEntry;
  isEditing: boolean;
  draftName: string;
  pending: boolean;
  onDraftChange: (value: string) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onRenameSave: () => void;
  onDelete: () => void;
}) {
  if (isEditing) {
    return (
      <li className="rounded-md border border-border p-3">
        <div className="space-y-2">
          <input
            aria-label="Rename passkey"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={draftName}
            onChange={(event) => onDraftChange(event.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onRenameSave}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEditCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {passkey.friendly_name || "Unnamed passkey"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Added {new Date(passkey.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Rename passkey"
            onClick={onEditStart}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Delete passkey"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </li>
  );
}
