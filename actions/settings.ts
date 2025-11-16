"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ActionResponse, DealershipInfo, WorkingHour, User } from "@/types";
import { dealershipInfoSchema } from "@/lib/schemas";
import { ROUTES } from "@/lib/routes";

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
      `
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

export async function saveWorkingHours(
  dealershipId: string,
  workingHours: WorkingHourInput[]
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

    if (!user || user.role !== "ADMIN") {
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

    if (!user || user.role !== "ADMIN") {
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

export async function updateUserRole(
  userId: string,
  newRole: "ADMIN" | "USER"
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

    if (!user || user.role !== "ADMIN") {
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

export async function updateDealershipInfo(
  dealershipId: string,
  data: {
    name: string;
    address: string;
    email: string;
    phone: string;
    whatsappPhone: string;
  }
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

    if (!user || user.role !== "ADMIN") {
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
