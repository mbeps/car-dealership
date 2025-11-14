export { getSupabaseUrl, getSupabasePublishableKey } from "./supabase-env";

export const getSupabaseSecretKey = (): string => {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase secret key. Set SUPABASE_SECRET_KEY or legacy SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return key;
};
