"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function back(formData: FormData, result: string) {
  const value = formData.get("returnTo");
  const path =
    typeof value === "string" && value.startsWith("/admin/messages") && !value.startsWith("//")
      ? value.split("?")[0]
      : "/admin/messages";
  redirect(`${path}?${result}`);
}

export async function markMessage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!z.uuid().safeParse(id).success || (status !== "read" && status !== "archived")) {
    back(formData, "erreur=message");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
  back(formData, error ? "erreur=message" : status === "archived" ? "notice=traite" : "notice=lu");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "oui") back(formData, "erreur=confirmation");
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) back(formData, "erreur=message");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) back(formData, "erreur=message");
  redirect("/admin/messages?notice=supprime");
}
