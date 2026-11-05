import "server-only";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  role: z.literal("admin").nullable(),
});

export type AdminSession = {
  id: string;
  email: string | null;
};

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    redirect("/auth/sign-out?erreur=profil");
  }

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success || parsed.data.role !== "admin") {
    redirect("/auth/sign-out?erreur=role");
  }

  return { id: user.id, email: user.email ?? null };
}
