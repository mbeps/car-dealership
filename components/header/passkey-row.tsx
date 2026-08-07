"use client";

import { Button } from "@/components/ui/button";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import type { PasskeyEntry } from "./account-dialog";

/**
 * Props for a single passkey row with edit and delete controls.
 */
interface PasskeyRowProps {
  /** The passkey entry to display in the row. */
  passkey: PasskeyEntry;
  /** Whether the row is in edit mode for renaming. */
  isEditing: boolean;
  /** The current draft name for the passkey. */
  draftName: string;
  /** Whether an action (rename/delete) is pending for this passkey. */
  pending: boolean;
  /** Callback to update the draft name. */
  onDraftChange: (value: string) => void;
  /** Callback to initiate editing this passkey. */
  onEditStart: () => void;
  /** Callback to cancel editing this passkey. */
  onEditCancel: () => void;
  /** Callback to save the renamed passkey. */
  onRenameSave: () => void;
  /** Callback to delete this passkey. */
  onDelete: () => void;
}

/**
 * Renders a single passkey row with edit and delete controls.
 *
 * @param passkey - The passkey entry to display
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
export function PasskeyRow({
  passkey,
  isEditing,
  draftName,
  pending,
  onDraftChange,
  onEditStart,
  onEditCancel,
  onRenameSave,
  onDelete,
}: PasskeyRowProps) {
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
