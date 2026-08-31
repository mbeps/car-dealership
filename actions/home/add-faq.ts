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
 * Adds a new FAQ entry to the database and revalidates relevant caches.
 * Requires admin authorization.
 *
 * @param data - The validated FAQ form data
 * @returns An action response containing the newly created FAQ or an error message
 */
export async function addFAQ(
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

    const { data: newFAQ, error } = await supabase
      .from("FAQ")
      .insert(validated)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidateTag(FAQ_TAG, "max");
    revalidatePath("/", "layout");
    return { success: true, data: newFAQ };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
