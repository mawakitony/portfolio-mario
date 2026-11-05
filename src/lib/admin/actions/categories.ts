"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import { categorySchema } from "@/lib/admin/schemas";
import type { ActionState } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fail(message: string): ActionState {
  return { ok: false, message };
}

export async function saveCategoryAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder") || "0",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "La catégorie est incomplète.");

  const supabase = await createSupabaseServerClient();
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId.length > 0 ? rawId : null;
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    sort_order: parsed.data.sortOrder,
  };

  const query = id
    ? supabase.from("categories").update(payload).eq("id", id)
    : supabase.from("categories").insert(payload);
  const { error } = await query;
  if (error) {
    if (error.code === "23505") return fail("Ce slug de catégorie existe déjà.");
    return fail("La catégorie n'a pas été enregistrée.");
  }

  refreshPublicContent();
  if (!id) redirect("/admin/categories?notice=categorie");
  return { ok: true, message: "La catégorie est enregistrée." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "oui") redirect("/admin/categories?erreur=confirmation");
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/categories?erreur=introuvable");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error?.code === "23503") redirect("/admin/categories?erreur=utilisee");
  if (error) redirect("/admin/categories?erreur=suppression");
  refreshPublicContent();
  redirect("/admin/categories?notice=supprimee");
}

export async function reorderCategories(formData: FormData) {
  await requireAdmin();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter((id) => z.uuid().safeParse(id).success);
  const supabase = await createSupabaseServerClient();
  for (const id of ids) {
    const sortOrder = Number(formData.get(`sort_${id}`));
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) continue;
    await supabase.from("categories").update({ sort_order: sortOrder }).eq("id", id);
  }
  refreshPublicContent();
  redirect("/admin/categories?notice=ordre");
}
