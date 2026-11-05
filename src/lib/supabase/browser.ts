"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { url, key } = getPublicSupabaseEnv();
  return createBrowserClient(url, key);
}
