import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

/** Lecture anonyme, sans cookie. Réservée au contenu déjà publié. */
export function createSupabasePublicClient() {
  const { url, key } = getPublicSupabaseEnv();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
