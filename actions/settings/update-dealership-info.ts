"use server";

import { ROUTES } from "@/constants/routes";
import { dealershipInfoSchema } from "@/schemas/dealership-info";
import { ensureAdminUser } from "@/lib/supabase/ensure-admin-user";
import { revalidateBrandingPages } from "@/lib/helpers/branding-cache";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";

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
    const { supabase } = await ensureAdminUser();

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
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
