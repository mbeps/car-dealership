"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { z } from "zod";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { createClient } from "@/lib/supabase/supabase";
import { faqSchema } from "@/schemas/home-content";
import type { ActionResponse } from "@/types/common/action-response";
import type { FAQ } from "@/types/home-content/faq";

const FAQ_TAG = "faq";

/**
 * Updates an existing FAQ entry in the database.
 * Requires admin authorization.
 *
 * @param id - The unique identifier of the FAQ to update
 * @param data - The updated FAQ field values
 * @returns An action response containing the updated FAQ or an error message
 */
export async function updateFAQ(
  id: string,
  data: z.infer<typeof faqSchema>,
): Promise<ActionResponse<FAQ>> {
  try {
    const validated = faqSchema.parse(data);
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

    const { data: updated, error } = await supabase
      .from("FAQ")
      .update(validated)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidateTag(FAQ_TAG, "max");
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
