"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { createClient } from "@/lib/supabase/supabase";
import type { ActionResponse } from "@/types/common/action-response";

const FAQ_TAG = "faq";

/**
 * Deletes an existing FAQ entry by its ID and revalidates relevant caches.
 * Requires admin authorization.
 *
 * @param id - The unique identifier of the FAQ to delete
 * @returns An action response determining success or failure
 */
export async function deleteFAQ(id: string): Promise<ActionResponse<void>> {
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

    const { error } = await supabase.from("FAQ").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidateTag(FAQ_TAG, "max");
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
