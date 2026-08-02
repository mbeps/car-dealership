"use server";

import { createAdminClient } from "@/lib/supabase/supabase";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import {
  validateAndPrepareLogoUpload,
  buildVersionedLogoPath,
} from "@/lib/helpers/logo-upload";
import { getErrorMessage } from "@/lib/helpers/get-error-message";
import { revalidateBrandingPages } from "@/lib/helpers/branding-cache";
import type { LogoUploadPayload } from "@/schemas/logo-upload";
import type { ActionResponse } from "@/types/common/action-response";

/**
 * Uploads and updates the dealership logo metadata.
 * Uses a versioned storage path and one-day cache headers for reliable cache busting.
 */
export async function updateDealershipLogo(
  dealershipId: string,
  file: LogoUploadPayload,
): Promise<ActionResponse<string>> {
  let uploadedPath: string | null = null;

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

    const validatedFile = validateAndPrepareLogoUpload(file);
    const logoVersion = Date.now().toString();
    const nextPath = buildVersionedLogoPath(
      dealershipId,
      logoVersion,
      validatedFile.extension,
    );

    const supabaseAdmin = createAdminClient();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("branding-assets")
      .upload(nextPath, validatedFile.bytes, {
        contentType: validatedFile.mimeType,
        cacheControl: "86400",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }

    uploadedPath = nextPath;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("branding-assets")
      .getPublicUrl(nextPath);

    const { error: updateError } = await supabase
      .from("DealershipInfo")
      .update({
        logoUrl: publicUrlData.publicUrl,
        logoPath: nextPath,
        logoVersion,
        logoMimeType: validatedFile.mimeType,
        logoSizeBytes: validatedFile.sizeBytes,
        logoUpdatedAt: new Date().toISOString(),
      })
      .eq("id", dealershipId);

    if (updateError) {
      await supabaseAdmin.storage.from("branding-assets").remove([nextPath]);
      throw new Error(`Failed to update logo metadata: ${updateError.message}`);
    }

    if (dealership.logoPath && dealership.logoPath !== nextPath) {
      await supabaseAdmin.storage
        .from("branding-assets")
        .remove([dealership.logoPath]);
    }

    revalidateBrandingPages();

    return {
      success: true,
      data: "Dealership logo updated successfully",
    };
  } catch (error) {
    if (uploadedPath) {
      try {
        const supabaseAdmin = createAdminClient();
        await supabaseAdmin.storage
          .from("branding-assets")
          .remove([uploadedPath]);
      } catch (cleanupError) {
        console.error("Error cleaning up failed logo upload:", cleanupError);
      }
    }

    console.error("Error updating dealership logo:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
