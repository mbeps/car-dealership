"use server";

import { createClient, createPublicClient } from "@/lib/supabase/supabase";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { ActionResponse } from "@/types/common/action-response";
import type { HomePageContent, FAQ } from "@/types/home-content";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { homePageContentSchema, faqSchema } from "@/schemas/home-content";
import { z } from "zod";

const HOME_CONTENT_TAG = "home-content";
const FAQ_TAG = "faq";

/**
 * Fetches the singleton home page content.
 * Cached with unstable_cache.
 */
export const getHomePageContent = unstable_cache(
  async (): Promise<HomePageContent | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("HomePageContent")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching home page content:", error);
      return null;
    }

    return data;
  },
  [HOME_CONTENT_TAG],
  { tags: [HOME_CONTENT_TAG] }
);

/**
 * Fetches all FAQs ordered by 'order'.
 * Cached with unstable_cache.
 */
export const getFAQs = unstable_cache(
  async (): Promise<FAQ[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("FAQ")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      console.error("Error fetching FAQs:", error);
      return [];
    }

    return data;
  },
  [FAQ_TAG],
  { tags: [FAQ_TAG] }
);

/**
 * Updates the home page content.
 * Admin only. Supports partial updates.
 */
export async function updateHomePageContent(
  data: Partial<z.infer<typeof homePageContentSchema>>
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

    revalidateTag(HOME_CONTENT_TAG);
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Adds a new FAQ.
 * Admin only.
 */
export async function addFAQ(
  data: z.infer<typeof faqSchema>
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

    revalidateTag(FAQ_TAG);
    revalidatePath("/", "layout");
    return { success: true, data: newFAQ };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates an existing FAQ.
 * Admin only.
 */
export async function updateFAQ(
  id: string,
  data: z.infer<typeof faqSchema>
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

    revalidateTag(FAQ_TAG);
    revalidatePath("/", "layout");
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Deletes an FAQ.
 * Admin only.
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

    revalidateTag(FAQ_TAG);
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reorders FAQs by updating their order field.
 * Admin only. Accepts an array of {id, order} pairs.
 */
export async function reorderFAQs(
  updates: Array<{ id: string; order: number }>
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
      supabase.from("FAQ").update({ order }).eq("id", id)
    );

    await Promise.all(updatePromises);

    // Fetch updated FAQs
    const { data: updatedFAQs, error } = await supabase
      .from("FAQ")
      .select("*")
      .order("order", { ascending: true });

    if (error) throw new Error(error.message);

    revalidateTag(FAQ_TAG);
    revalidatePath("/", "layout");
    return { success: true, data: updatedFAQs };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
