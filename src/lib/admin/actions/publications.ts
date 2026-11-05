"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseEmbed } from "@/lib/admin/embeds";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/admin/slug";
import type { ActionState } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fail(message: string): ActionState {
  return { ok: false, message };
}

export async function preparePublication(input: unknown): Promise<
  { ok: true; id: string; slug: string } | { ok: false; message: string }
> {
  await requireAdmin();
  const parsed = z
    .object({
      title: z.string().trim().min(1, "Le titre est obligatoire.").max(160),
      description: z.string().trim().max(300),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Le titre est obligatoire." };

  const supabase = await createSupabaseServerClient();
  const base = slugify(parsed.data.title) === "projet" ? "publication" : slugify(parsed.data.title);
  let slug = base;
  for (let index = 0; index < 6; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const { data } = await supabase.from("projects").select("id").eq("slug", candidate).maybeSingle();
    if (!data) {
      slug = candidate;
      break;
    }
    if (index === 5) slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.description || null,
      description: parsed.data.description || null,
      status: "draft",
      tools: [],
      is_featured: false,
      sort_order: 0,
    })
    .select("id, slug")
    .single();
  if (error || !data) return { ok: false, message: "La publication n'a pas pu être créée." };
  return { ok: true, id: data.id, slug: data.slug };
}

export async function attachEmbedToPublication(input: unknown): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ projectId: z.uuid(), url: z.string().trim().max(500) }).safeParse(input);
  if (!parsed.success) return fail("Le lien est invalide.");
  const embed = parseEmbed(parsed.data.url);
  if (!embed) return fail("Le lien doit être une adresse YouTube ou Vimeo.");

  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, status, slug")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) return fail("La publication est introuvable.");

  const { error } = await supabase.from("project_media").insert({
    project_id: project.id,
    kind: "embed",
    role: "video",
    provider: embed.provider,
    external_id: embed.id,
    external_url: embed.url,
    visibility: "private",
    sort_order: 0,
    created_by: admin.id,
  });
  if (error) return fail("La vidéo en ligne n'a pas été enregistrée.");
  return { ok: true, message: "La vidéo est associée." };
}

export async function discardEmptyPublication(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id);
  if ((count ?? 0) > 0) return;
  await supabase.from("projects").delete().eq("id", id).eq("status", "draft");
}

export async function finalizePublication(input: unknown): Promise<
  { ok: true; message: string; slug: string } | { ok: false; message: string }
> {
  await requireAdmin();
  const parsed = z.object({ id: z.uuid(), intent: z.enum(["publish", "draft"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "La publication est introuvable." };
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!project) return { ok: false, message: "La publication est introuvable." };

  if (parsed.data.intent === "draft") {
    refreshPublicContent(project.slug);
    return {
      ok: true,
      slug: project.slug,
      message: "Brouillon enregistré. Il reste invisible sur le site.",
    };
  }

  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);
  if ((count ?? 0) === 0) {
    return { ok: false, message: "Ajoute une image ou une vidéo avant de publier." };
  }

  const { error } = await supabase.from("projects").update({ status: "published" }).eq("id", project.id);
  if (error) return { ok: false, message: "La publication n'a pas abouti." };
  const { error: mediaError } = await supabase
    .from("project_media")
    .update({ visibility: "public" })
    .eq("project_id", project.id);
  refreshPublicContent(project.slug);
  if (mediaError) {
    return { ok: false, message: "Le texte est en ligne, mais le fichier n'est pas encore visible. Réessaie." };
  }
  return { ok: true, slug: project.slug, message: "C'est en ligne." };
}

export async function updatePublicationDetails(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.uuid(),
      title: z.string().trim().min(1, "Le titre est obligatoire.").max(160),
      description: z.string().trim().max(300),
    })
    .safeParse({
      id: formData.get("id"),
      title: formData.get("title"),
      description: formData.get("description"),
    });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Le titre est obligatoire.");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      title: parsed.data.title,
      excerpt: parsed.data.description || null,
      description: parsed.data.description || null,
    })
    .eq("id", parsed.data.id)
    .select("slug")
    .maybeSingle();
  if (error || !data) return fail("Les informations n'ont pas été enregistrées.");
  refreshPublicContent(data.slug);
  return { ok: true, message: "Les informations sont enregistrées." };
}
