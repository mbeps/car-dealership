"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/use-sign-in";
import { createBrowserClient } from "@/lib/supabase/supabase-client";
import { PasskeyRow } from "./passkey-row";

export interface PasskeyEntry {
  id: string;
  friendly_name?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

interface PasskeyFeedback {
  type: "error" | "success";
  message: string;
}

export interface PasskeyManagerProps {
  userId?: string;
}

/**
 * Manages passkeys for the current user, handling list, add, rename, and delete flows.
 */
export function PasskeyManager({ userId }: PasskeyManagerProps) {
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

  const loadPasskeys = React.useCallback(async () => {
    if (!userId || !supportsPasskeys) {
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
  }, [supabase, supportsPasskeys, userId]);

  React.useEffect(() => {
    if (!userId || !supportsPasskeys) {
      setPasskeys([]);
      setPasskeyFeedback(null);
      return;
    }

    void loadPasskeys();
  }, [loadPasskeys, supportsPasskeys, userId]);

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
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">Passkeys</p>
          <p className="text-muted-foreground text-sm">
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
          <span className="text-muted-foreground text-sm">Unsupported</span>
        )}
      </div>

      {passkeyFeedback && (
        <Alert
          variant={passkeyFeedback.type === "error" ? "destructive" : undefined}
          className={
            passkeyFeedback.type === "success"
              ? "border-green-500 text-green-700"
              : undefined
          }
        >
          <AlertDescription>{passkeyFeedback.message}</AlertDescription>
        </Alert>
      )}

      {supportsPasskeys ? (
        <div className="space-y-3">
          {passkeysLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
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
            <div className="rounded-md border border-border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm">
              No passkeys yet. Add one from this device to sign in faster.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border border-dashed bg-muted/30 p-3 text-muted-foreground text-sm">
          Passkeys are not supported in this browser. You can still use email
          sign-in.
        </div>
      )}
    </div>
  );
}
