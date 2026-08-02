"use server";

import { createClient } from "@/lib/supabase/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";
import type { FAQ } from "@/types/home-content/faq";
import { UserRoleEnum as UserRole } from "@/enums/user-role";

const FAQ_TAG = "faq";

/**
 * Reorders FAQs by updating their order field.
 * Admin only. Accepts an array of {id, order} pairs.
 */
export async function reorderFAQs(
  updates: Array<{ id: string; order: number }>,
): Promise<ActionResponse<FAQ[]>> {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Unauthorized");

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (!user || user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized access");
    }

    // Update each FAQ's order field
    const updatePromises = updates.map(({ id, order }) =>
      supabase.from("FAQ").update({ order }).eq("id", id),
    );

    await Promise.all(updatePromises);

    // Fetch updated FAQs
    const { data: updatedFAQs, error } = await supabase
      .from("FAQ")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw new Error(error.message);

    revalidateTag(FAQ_TAG, "max");
    revalidatePath("/", "layout");
    return { success: true, data: updatedFAQs };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
