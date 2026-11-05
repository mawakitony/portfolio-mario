"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { loginSchema } from "@/lib/auth/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

const profileSchema = z.object({
  role: z.literal("admin").nullable(),
});

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Indique une adresse e-mail valide et un mot de passe d'au moins 8 caractères.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "L'adresse e-mail n'est pas encore confirmée." };
    }
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "La session n'a pas pu être établie." };
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error:
        "Le profil est inaccessible. Applique les migrations avant d'attribuer le rôle admin.",
    };
  }

  const profile = profileSchema.safeParse(data);
  if (!profile.success || profile.data.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Ce compte n'a pas le rôle administrateur." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
