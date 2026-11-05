"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { agency } from "@/lib/content/agency";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mediaRules } from "@/lib/admin/media-rules";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import { serviceSchema, settingsSchema, splitList } from "@/lib/admin/schemas";
import { slugify } from "@/lib/admin/slug";
import type { ActionState } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const assetSchema = z.object({
  bucket: z.literal("images"),
  path: z.string().regex(/^branding\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/),
});

function fail(message: string): ActionState {
  return { ok: false, message };
}

export async function saveSettingsAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    signature: formData.get("signature"),
    director: formData.get("director"),
    role: formData.get("role"),
    promise: formData.get("promise"),
    about: formData.get("about"),
    email: formData.get("email"),
    phones: formData.get("phones"),
    location: formData.get("location"),
    instagram: formData.get("instagram"),
    facebook: formData.get("facebook"),
    linkedin: formData.get("linkedin"),
    behance: formData.get("behance"),
    youtube: formData.get("youtube"),
    tiktok: formData.get("tiktok"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Les réglages sont incomplets.");

  const supabase = await createSupabaseServerClient();
  const rows = [
    {
      key: "identity",
      value: {
        name: parsed.data.name,
        legalName: parsed.data.legalName,
        signature: parsed.data.signature,
        director: parsed.data.director,
        role: parsed.data.role,
        promise: parsed.data.promise,
      },
    },
    { key: "about", value: { text: parsed.data.about } },
    {
      key: "contact",
      value: { email: parsed.data.email, phones: parsed.data.phones, location: parsed.data.location },
    },
    {
      key: "social",
      value: {
        instagram: parsed.data.instagram,
        facebook: parsed.data.facebook,
        linkedin: parsed.data.linkedin,
        behance: parsed.data.behance,
        youtube: parsed.data.youtube,
        tiktok: parsed.data.tiktok,
      },
    },
    { key: "seo", value: { title: parsed.data.seoTitle, description: parsed.data.seoDescription } },
  ];
  const { error } = await supabase.from("site_settings").upsert(rows);
  if (error) return fail("Les réglages n'ont pas été enregistrés.");
  refreshPublicContent();
  return { ok: true, message: "Les réglages sont en ligne." };
}

export async function setBrandingAsset(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ kind: z.enum(["logo", "portrait"]), bucket: z.literal("images"), path: assetSchema.shape.path })
    .safeParse(input);
  if (!parsed.success) return fail("L'image reçue est invalide.");
  if (!(mediaRules.images.types as readonly string[]).includes(mimeFromPath(parsed.data.path))) {
    return fail("Ce format d'image n'est pas accepté.");
  }

  const supabase = await createSupabaseServerClient();
  const folder = "branding";
  const name = parsed.data.path.slice(folder.length + 1);
  const { data: listed } = await supabase.storage.from("images").list(folder, { search: name, limit: 10 });
  if (!listed?.some((file) => file.name === name)) return fail("L'image n'a pas été trouvée dans le stockage.");

  const { data: current } = await supabase.from("site_settings").select("value").eq("key", "branding").maybeSingle();
  const stored = z
    .object({ logo: assetSchema.nullable().optional(), portrait: assetSchema.nullable().optional() })
    .safeParse(current?.value);
  const previous = stored.success ? (stored.data[parsed.data.kind] ?? null) : null;
  const next = {
    logo: stored.success ? (stored.data.logo ?? null) : null,
    portrait: stored.success ? (stored.data.portrait ?? null) : null,
    [parsed.data.kind]: { bucket: "images" as const, path: parsed.data.path },
  };
  const { error } = await supabase.from("site_settings").upsert({ key: "branding", value: next });
  if (error) return fail("L'image n'a pas été associée au site.");
  if (previous && previous.path !== parsed.data.path) {
    await supabase.storage.from(previous.bucket).remove([previous.path]);
  }
  refreshPublicContent();
  return { ok: true, message: parsed.data.kind === "logo" ? "Le logo est en ligne." : "Le portrait est en ligne." };
}

export async function removeBrandingAsset(formData: FormData) {
  await requireAdmin();
  const kind = formData.get("kind");
  if (kind !== "logo" && kind !== "portrait") redirect("/admin/parametres?erreur=image");
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("site_settings").select("value").eq("key", "branding").maybeSingle();
  const stored = z
    .object({ logo: assetSchema.nullable().optional(), portrait: assetSchema.nullable().optional() })
    .safeParse(current?.value);
  const previous = stored.success ? (stored.data[kind] ?? null) : null;
  const next = {
    logo: stored.success ? (stored.data.logo ?? null) : null,
    portrait: stored.success ? (stored.data.portrait ?? null) : null,
    [kind]: null,
  };
  const { error } = await supabase.from("site_settings").upsert({ key: "branding", value: next });
  if (!error && previous) await supabase.storage.from(previous.bucket).remove([previous.path]);
  refreshPublicContent();
  redirect(`/admin/parametres?${error ? "erreur=image" : "notice=image"}`);
}

export async function saveServiceAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    items: splitList(formData.get("items")),
    sortOrder: formData.get("sortOrder") || "0",
    status: formData.get("status"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Le service est incomplet.");
  const supabase = await createSupabaseServerClient();
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId.length > 0 ? rawId : null;
  const payload = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    summary: parsed.data.summary,
    body: parsed.data.body,
    items: parsed.data.items,
    sort_order: parsed.data.sortOrder,
    status: parsed.data.status,
  };
  const { error } = id
    ? await supabase.from("services").update(payload).eq("id", id)
    : await supabase.from("services").insert(payload);
  if (error) return fail(error.code === "23505" ? "Ce slug de service existe déjà." : "Le service n'a pas été enregistré.");
  refreshPublicContent();
  if (!id) redirect("/admin/parametres?notice=service");
  return { ok: true, message: parsed.data.status === "published" ? "Le service est publié." : "Le service est enregistré." };
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "oui") redirect("/admin/parametres?erreur=confirmation");
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/parametres?erreur=service");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  refreshPublicContent();
  redirect(`/admin/parametres?${error ? "erreur=service" : "notice=service-supprime"}`);
}

export async function importCurrentServices() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true });
  if (countError) redirect("/admin/parametres?erreur=service");
  if ((count ?? 0) > 0) redirect("/admin/parametres?erreur=services-existants");
  const { error } = await supabase.from("services").insert(
    agency.services.map((service, index) => ({
      title: service.title,
      slug: slugify(service.slug),
      summary: service.summary,
      items: [],
      sort_order: index,
      status: "draft",
    })),
  );
  refreshPublicContent();
  redirect(`/admin/parametres?${error ? "erreur=service" : "notice=services-importes"}`);
}

function mimeFromPath(path: string) {
  const extension = path.split(".").pop();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return map[extension ?? ""] ?? "";
}
