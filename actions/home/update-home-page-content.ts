"use server";

import { createClient } from "@/lib/supabase/supabase";
import { revalidatePath, revalidateTag } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";
import type { HomePageContent } from "@/types/home-content/home-page-content";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { homePageContentSchema } from "@/schemas/home-content";
import { z } from "zod";

const HOME_CONTENT_TAG = "home-content";

/**
 * Updates the home page content.
 * Admin only. Supports partial updates.
 */
export async function updateHomePageContent(
  data: Partial<z.infer<typeof homePageContentSchema>>,
): Promise<ActionResponse<HomePageContent>> {
  try {
    const validated = homePageContentSchema.partial().parse(data);
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

    // Update singleton
    // We assume ID is 'singleton' based on migration, but we can just update the single row if we don't know the ID
    // Or better, fetch the ID first or use a known ID.
    // The migration used 'singleton' as ID.
    const { data: updated, error } = await supabase
      .from("HomePageContent")
      .update(validated)
      .eq("id", "singleton")
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidateTag(HOME_CONTENT_TAG, "max");
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
