"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseEmbed } from "@/lib/admin/embeds";
import { mediaRules } from "@/lib/admin/media-rules";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import type { ActionState } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const pathSchema = z.string().regex(/^(library|projects)\/[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm)$/);
const uploadSchema = z.object({
  projectId: z.uuid().nullable(),
  bucket: z.enum(["images", "videos", "posters"]),
  path: pathSchema,
  mime: z.string(),
});

function fail(message: string): ActionState {
  return { ok: false, message };
}

function ruleFor(bucket: "images" | "videos" | "posters") {
  return Object.values(mediaRules).find((rule) => rule.bucket === bucket);
}

async function projectStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string | null,
) {
  if (!projectId) return null;
  const { data } = await supabase.from("projects").select("id, status, slug").eq("id", projectId).maybeSingle();
  return data as { id: string; status: "draft" | "published"; slug: string } | null;
}

export async function registerUploadedMedia(input: unknown): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return fail("Le fichier reçu est invalide.");
  const rule = ruleFor(parsed.data.bucket);
  if (!rule || !(rule.types as readonly string[]).includes(parsed.data.mime)) {
    return fail("Ce format n'est pas accepté.");
  }

  const supabase = await createSupabaseServerClient();
  const project = await projectStatus(supabase, parsed.data.projectId);
  if (parsed.data.projectId && !project) return fail("Le projet associé est introuvable.");

  const { data: signed, error: signError } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUrl(parsed.data.path, 60);
  if (signError || !signed?.signedUrl) {
    await supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
    return fail("Le fichier n'a pas été confirmé dans le stockage. Rien n'a été ajouté.");
  }

  const folder = parsed.data.path.slice(0, parsed.data.path.lastIndexOf("/"));
  const name = parsed.data.path.slice(folder.length + 1);
  const { data: listed } = await supabase.storage.from(parsed.data.bucket).list(folder, {
    search: name,
    limit: 10,
  });
  const stored = listed?.find((file) => file.name === name);
  const metadata = stored?.metadata as { size?: number; mimetype?: string } | null;
  const size = typeof metadata?.size === "number" ? metadata.size : null;
  if (size !== null && size > rule.maxBytes) {
    await supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
    return fail("Le fichier dépasse la taille autorisée. Il a été retiré du stockage.");
  }
  if (metadata?.mimetype && !(rule.types as readonly string[]).includes(metadata.mimetype)) {
    await supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
    return fail("Le type de fichier ne correspond pas au dossier. Il a été retiré du stockage.");
  }

  const countQuery = supabase.from("project_media").select("id", { count: "exact", head: true });
  const { count } = await (parsed.data.projectId
    ? countQuery.eq("project_id", parsed.data.projectId)
    : countQuery.is("project_id", null));

  const { error } = await supabase.from("project_media").insert({
    project_id: parsed.data.projectId,
    bucket: parsed.data.bucket,
    storage_path: parsed.data.path,
    mime_type: metadata?.mimetype ?? parsed.data.mime,
    kind: rule.kind,
    byte_size: size,
    role: rule.kind === "video" ? "video" : rule.kind === "poster" ? "poster" : "gallery",
    sort_order: count ?? 0,
    visibility: project?.status === "published" ? "public" : "private",
    provider: "storage",
    created_by: admin.id,
  });

  if (error) {
    const { data: existing } = await supabase
      .from("project_media")
      .select("id, project_id")
      .eq("bucket", parsed.data.bucket)
      .eq("storage_path", parsed.data.path)
      .maybeSingle();
    if (existing && existing.project_id === parsed.data.projectId) {
      return { ok: true, message: "Le fichier est déjà enregistré." };
    }
    if (!existing) {
      await supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
    }
    return fail(
      existing
        ? "Ce fichier est déjà associé à une autre publication."
        : "Le média n'a pas pu être enregistré. Le fichier a été retiré.",
    );
  }

  if (project) refreshPublicContent(project.slug);
  return { ok: true, message: "Le fichier est enregistré." };
}

export async function discardUnregisteredUpload(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = z.object({ bucket: z.enum(["images", "videos", "posters"]), path: pathSchema }).safeParse(input);
  if (!parsed.success) return fail("Le fichier à retirer est invalide.");
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("bucket", parsed.data.bucket)
    .eq("storage_path", parsed.data.path);
  if ((count ?? 0) > 0) return { ok: true, message: "Le fichier est déjà associé." };
  await supabase.storage.from(parsed.data.bucket).remove([parsed.data.path]);
  return { ok: true, message: "Le fichier incomplet a été retiré." };
}

export async function deleteMedia(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "oui") redirect(withQuery(returnTo(formData), "erreur=confirmation"));
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/mediatheque?erreur=media");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_media")
    .select("bucket, storage_path, project_id")
    .eq("id", id)
    .maybeSingle();
  if (!data) redirect("/admin/mediatheque?erreur=media");

  const { error } = await supabase.from("project_media").delete().eq("id", id);
  if (error) redirect(withQuery(returnTo(formData), "erreur=media"));
  if (data.bucket && data.storage_path) {
    await supabase.storage.from(data.bucket).remove([data.storage_path]);
  }
  refreshPublicContent();
  redirect(withQuery(returnTo(formData), "notice=media-supprime"));
}

export async function updateMediaDetails(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/mediatheque?erreur=media");
  const alt = String(formData.get("altText") ?? "").trim().slice(0, 180);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 240);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_media")
    .update({ alt_text: alt || null, caption: caption || null })
    .eq("id", id);
  refreshPublicContent();
  redirect(withQuery(returnTo(formData), error ? "erreur=media" : "notice=media"));
}

export async function reorderMedia(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ projectId: z.uuid().nullable(), ids: z.array(z.uuid()).min(1).max(200) })
    .safeParse(input);
  if (!parsed.success) return fail("L'ordre envoyé est invalide.");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("project_media").select("id, project_id").in("id", parsed.data.ids);
  if (error || (data ?? []).length !== parsed.data.ids.length) return fail("Certains médias sont introuvables.");
  if ((data ?? []).some((item) => item.project_id !== parsed.data.projectId)) {
    return fail("Ces médias n'appartiennent pas au même projet.");
  }
  for (const [index, id] of parsed.data.ids.entries()) {
    const { error: updateError } = await supabase.from("project_media").update({ sort_order: index }).eq("id", id);
    if (updateError) return fail("L'ordre n'a pas été enregistré.");
  }
  refreshPublicContent();
  return { ok: true, message: "L'ordre des médias est enregistré." };
}

export async function setCover(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(projectId).success) {
    redirect("/admin/mediatheque?erreur=media");
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("project_media")
    .update({ role: "gallery" })
    .eq("project_id", projectId)
    .eq("role", "cover");
  const { error } = await supabase
    .from("project_media")
    .update({ role: "cover" })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("kind", "image");
  refreshPublicContent();
  redirect(withQuery(returnTo(formData), error ? "erreur=media" : "notice=couverture"));
}

export async function setPoster(formData: FormData) {
  await requireAdmin();
  const videoId = String(formData.get("videoId") ?? "");
  const posterId = String(formData.get("posterId") ?? "");
  if (!z.uuid().safeParse(videoId).success || (posterId !== "" && !z.uuid().safeParse(posterId).success)) {
    redirect("/admin/mediatheque?erreur=media");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_media")
    .update({ poster_media_id: posterId || null })
    .eq("id", videoId);
  refreshPublicContent();
  redirect(withQuery(returnTo(formData), error ? "erreur=media" : "notice=miniature"));
}

export async function attachMedia(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(projectId).success) {
    redirect("/admin/mediatheque?erreur=media");
  }
  const supabase = await createSupabaseServerClient();
  const project = await projectStatus(supabase, projectId);
  if (!project) redirect("/admin/mediatheque?erreur=introuvable");
  const { error } = await supabase
    .from("project_media")
    .update({
      project_id: projectId,
      visibility: project.status === "published" ? "public" : "private",
    })
    .eq("id", id);
  refreshPublicContent(project.slug);
  redirect(withQuery(returnTo(formData), error ? "erreur=media" : "notice=rattache"));
}

export async function detachMedia(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/mediatheque?erreur=media");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("project_media")
    .update({ project_id: null, visibility: "private" })
    .eq("id", id);
  refreshPublicContent();
  redirect(withQuery(returnTo(formData), error ? "erreur=media" : "notice=detache"));
}

export async function addEmbed(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const embed = parseEmbed(String(formData.get("url") ?? ""));
  if (!z.uuid().safeParse(projectId).success || !embed) {
    redirect(withQuery(returnTo(formData), "erreur=embed"));
  }
  const supabase = await createSupabaseServerClient();
  const project = await projectStatus(supabase, projectId);
  if (!project) redirect("/admin/projets?erreur=introuvable");
  const { count } = await supabase
    .from("project_media")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { error } = await supabase.from("project_media").insert({
    project_id: projectId,
    kind: "embed",
    role: "video",
    provider: embed.provider,
    external_id: embed.id,
    external_url: embed.url,
    visibility: project.status === "published" ? "public" : "private",
    sort_order: count ?? 0,
    created_by: admin.id,
  });
  refreshPublicContent(project.slug);
  redirect(withQuery(returnTo(formData), error ? "erreur=embed" : "notice=embed"));
}

function withQuery(path: string, query: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function returnTo(formData: FormData) {
  const value = formData.get("returnTo");
  if (
    typeof value === "string" &&
    value.startsWith("/admin") &&
    !value.startsWith("//") &&
    !value.includes("://") &&
    !value.includes("\\")
  ) {
    return value;
  }
  return "/admin/mediatheque";
}
