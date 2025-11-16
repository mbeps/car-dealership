"use server";

import { createClient } from "@/lib/supabase";
import { ActionResponse, User } from "@/types";

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return false;

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<
  ActionResponse<{ role: "USER" | "ADMIN" | null }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: { role: null },
      };
    }

    const { data: user } = await supabase
      .from("User")
      .select("role")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    return {
      success: true,
      data: { role: user?.role || null },
    };
  } catch (error) {
    console.error("Error getting user role:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get current user from database
 */
export async function getCurrentUser(): Promise<ActionResponse<User | null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: true,
        data: null,
      };
    }

    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("supabaseAuthUserId", authUser.id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: user as User,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
