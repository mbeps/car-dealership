"use server";

import { createClient } from "@/lib/supabase/supabase";
import { createAdminClient, createPublicClient } from "@/lib/supabase/supabase";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";
import type { DealershipInfo } from "@/types/dealership/dealership-info";
import type { WorkingHour } from "@/types/dealership/working-hour";
import type { User } from "@/types/user/user";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { dealershipInfoSchema } from "@/schemas/dealership-info";
import { ROUTES } from "@/constants/routes";
import {
  validateAndPrepareLogoUpload,
  buildVersionedLogoPath,
} from "@/lib/helpers/logo-upload";
import type { LogoUploadPayload } from "@/schemas/logo-upload";
import { DEALERSHIP_NAME } from "@/constants/dealership-name";

const BRANDING_CACHE_TAG = "public-branding";
const BRANDING_CACHE_TTL_SECONDS = 86_400;

type PublicBranding = Pick<DealershipInfo, "logoUrl" | "logoVersion" | "name">;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

const getCachedPublicBranding = unstable_cache(
  async (): Promise<PublicBranding> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("DealershipInfo")
      .select("logoUrl, logoVersion, name")
      .single();

    if (error || !data) {
      return {
        logoUrl: null,
        logoVersion: null,
        name: DEALERSHIP_NAME,
      };
    }

    return {
      logoUrl: data.logoUrl,
      logoVersion: data.logoVersion,
      name: data.name || DEALERSHIP_NAME,
    };
  },
  ["dealership-public-branding"],
  {
    revalidate: BRANDING_CACHE_TTL_SECONDS,
    tags: [BRANDING_CACHE_TAG],
  },
);

function revalidateBrandingPages(): void {
  revalidateTag(BRANDING_CACHE_TAG, "max");
  revalidatePath(ROUTES.ADMIN_SETTINGS);
  revalidatePath(ROUTES.HOME);
  revalidatePath(ROUTES.CARS);
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

async function ensureAdminUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("Unauthorized");
  }

  const { data: user } = await supabase
    .from("User")
    .select("id, role")
    .eq("supabaseAuthUserId", authUser.id)
    .single();

  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized access");
  }

  return { supabase, userId: user.id };
}

export async function getPublicBranding(): Promise<PublicBranding> {
  try {
    return await getCachedPublicBranding();
  } catch (error) {
    console.error("Error fetching public branding:", error);
    return {
      logoUrl: null,
      logoVersion: null,
      name: DEALERSHIP_NAME,
    };
  }
}

/**
 * Fetches dealership contact info and working hours.
 * Returns singleton record with nested hours.
 * Used for test drive forms and contact CTAs.
 *
 * @returns Dealership info with working hours or null
 * @see DealershipInfo - Singleton table
 * @see WorkingHour - Related hours table
 */
export async function getDealershipInfo(): Promise<
  ActionResponse<DealershipInfo | null>
> {
  try {
    const supabase = await createClient();

    const { data: dealership, error } = await supabase
      .from("DealershipInfo")
      .select(
        `
        *,
        workingHours:WorkingHour(*)
      `,
      )
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return {
      success: true,
      data: dealership || null,
    };
  } catch (error) {
    console.error("Error fetching dealership info:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

type WorkingHourInput = Omit<
  WorkingHour,
  "id" | "dealershipId" | "createdAt" | "updatedAt"
>;

/**
 * Replaces all working hours for dealership.
 * Deletes existing hours then inserts new set.
 * Revalidates admin settings and test drive pages.
 *
 * @param dealershipId - Target dealership
 * @param workingHours - New hours to save
 * @returns Success message or error
 * @see WorkingHour - Hours table
 */
export async function saveWorkingHours(
  dealershipId: string,
  workingHours: WorkingHourInput[],
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Delete existing working hours for this dealership
    const { error: deleteError } = await supabase
      .from("WorkingHour")
      .delete()
      .eq("dealershipId", dealershipId);

    if (deleteError) throw deleteError;

    // Insert new working hours if any provided
    if (workingHours.length > 0) {
      const hoursToInsert = workingHours.map((hour) => ({
        ...hour,
        dealershipId,
      }));

      const { error: insertError } = await supabase
        .from("WorkingHour")
        .insert(hoursToInsert);

      if (insertError) throw insertError;
    }

    revalidatePath(ROUTES.ADMIN_SETTINGS);
    // Revalidate test-drive pages as working hours affect availability
    revalidatePath("/test-drive");

    return {
      success: true,
      data: "Working hours updated successfully",
    };
  } catch (error) {
    console.error("Error saving working hours:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Fetches all users for admin user management.
 * Requires admin role.
 * Sorted by newest first.
 *
 * @returns All user records
 * @see User - Database user table
 */
export async function getUsers(): Promise<ActionResponse<User[]>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Fetch all users
    const { data: users, error } = await supabase
      .from("User")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: users || [],
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates user role from admin settings.
 * Prevents self-role changes.
 * Revalidates admin settings page.
 *
 * @param userId - User to update
 * @param newRole - ADMIN or USER
 * @returns Success message or error
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Don't allow updating own role
    if (user.id === userId) {
      return {
        success: false,
        error: "You cannot change your own role",
      };
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("User")
      .update({ role: newRole })
      .eq("id", userId);

    if (updateError) throw updateError;

    revalidatePath(ROUTES.ADMIN_SETTINGS);

    return {
      success: true,
      data: "User role updated successfully",
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates dealership contact information.
 * Validates input with zod schema.
 * Revalidates settings and test drive pages.
 *
 * @param dealershipId - Dealership to update
 * @param data - New contact info
 * @returns Success message or error
 * @see dealershipInfoSchema - Validation schema
 */
export async function updateDealershipInfo(
  dealershipId: string,
  data: {
    name: string;
    address: string;
    email: string;
    phone: string;
    whatsappPhone: string;
  },
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    // Verify admin status
    const { data: user } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Validate input data
    const validatedData = dealershipInfoSchema.parse(data);

    // Update dealership info
    const { error: updateError } = await supabase
      .from("DealershipInfo")
      .update({
        name: validatedData.name,
        address: validatedData.address,
        email: validatedData.email,
        phone: validatedData.phone,
        whatsappPhone: validatedData.whatsappPhone,
      })
      .eq("id", dealershipId);

    if (updateError) throw updateError;

    revalidatePath(ROUTES.ADMIN_SETTINGS);
    // Revalidate test-drive pages as dealership info is shown there
    revalidatePath("/test-drive");
    revalidateBrandingPages();

    return {
      success: true,
      data: "Dealership information updated successfully",
    };
  } catch (error) {
    console.error("Error updating dealership info:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

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

/**
 * Removes uploaded dealership logo and restores static fallbacks.
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
        console.error("Error deleting logo file:", removeError);
      }
    }

    revalidateBrandingPages();

    return {
      success: true,
      data: "Dealership logo removed successfully",
    };
  } catch (error) {
    console.error("Error removing dealership logo:", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
