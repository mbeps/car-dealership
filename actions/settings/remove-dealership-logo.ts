"use server";

import { revalidateBrandingPages } from "@/lib/helpers/branding-cache";
import { getErrorMessage } from "@/lib/helpers/get-error-message";
import { getLogger } from "@/lib/logger";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import { createAdminClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const log = getLogger(["app", "actions", "settings"]);

/**
 * Removes uploaded dealership logo and restores static fallbacks.
 * Clears database metadata and deletes the file from storage.
 * Requires admin privileges. Revalidates branding cache after change.
 *
 * @param dealershipId - The ID of the dealership
 * @returns Success message or error
 */
export async function removeDealershipLogo(
  dealershipId: string,
): Promise<ActionResponse<string>> {
  try {
    const { supabase } = await ensureAdminUser();

    const { data: dealership, error: dealershipError } = await supabase
      .from("DealershipInfo")
      .select("id, logoPath")
      .eq("id", dealershipId)
      .single();

    if (dealershipError || !dealership) {
      throw new Error("Dealership not found");
    }

    const { error: updateError } = await supabase
      .from("DealershipInfo")
      .update({
        logoUrl: null,
        logoPath: null,
        logoVersion: null,
        logoMimeType: null,
        logoSizeBytes: null,
        logoUpdatedAt: null,
      })
      .eq("id", dealershipId);

    if (updateError) {
      throw new Error(`Failed to remove logo metadata: ${updateError.message}`);
    }

    if (dealership.logoPath) {
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.storage
          .from("branding-assets")
          .remove([dealership.logoPath]);
      } catch (removeError) {
        log.error("Error deleting logo file: {error}", {
          error:
            removeError instanceof Error
              ? removeError.message
              : String(removeError),
        });
      }
    }

    log.info(
      "Dealership logo removed successfully (dealershipId: {dealershipId})",
      {
        dealershipId,
      },
    );

    revalidateBrandingPages();

    return {
      success: true,
      data: "Dealership logo removed successfully",
    };
  } catch (error) {
    log.error("Error removing dealership logo: {error}", {
      error: getErrorMessage(error),
    });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
