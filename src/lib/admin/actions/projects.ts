"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import { projectFieldsSchema, readLinks, splitList } from "@/lib/admin/schemas";
import { slugify } from "@/lib/admin/slug";
import type { ActionState } from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fail(message: string): ActionState {
  return { ok: false, message };
}

function safeReturn(value: FormDataEntryValue | null, fallback: string) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/admin") ||
    value.startsWith("//") ||
    value.includes("://") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}

function withQuery(path: string, query: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slug: string,
  exceptId?: string,
) {
  const { data } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
  return !data || data.id === exceptId;
}

async function replaceCategories(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  categoryIds: string[],
) {
  const { data: existing, error: readError } = await supabase
    .from("project_categories")
    .select("category_id")
    .eq("project_id", projectId);
  if (readError) return "categories";

  const current = new Set((existing ?? []).map((row) => row.category_id as string));
  const desired = [...new Set(categoryIds)];
  const toAdd = desired.filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desired.includes(id));

  if (toAdd.length > 0) {
    const { error } = await supabase.from("project_categories").insert(
      toAdd.map((categoryId, index) => ({
        project_id: projectId,
        category_id: categoryId,
        sort_order: index,
      })),
    );
    if (error) return error.code === "23503" ? "Une catégorie sélectionnée n'existe plus." : "categories";
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("project_categories")
      .delete()
      .eq("project_id", projectId)
      .in("category_id", toRemove);
    if (error) return "categories";
  }

  return null;
}

async function syncVisibility(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  status: "draft" | "published",
) {
  if (status !== "published") return null;
  const { error } = await supabase
    .from("project_media")
    .update({ visibility: "public" })
    .eq("project_id", projectId);
  return error ? "La publication des médias a échoué." : null;
}

async function saveLinks(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  projectId: string,
  links: { label: string; url: string }[],
) {
  const probe = await supabase.from("projects").select("external_links").eq("id", projectId).maybeSingle();
  if (probe.error) {
    return links.length > 0
      ? "Les autres champs sont enregistrés. Les liens externes attendent la migration SQL."
      : null;
  }
  const { error } = await supabase.from("projects").update({ external_links: links }).eq("id", projectId);
  return error ? "Les liens externes n'ont pas été enregistrés." : null;
}

function projectPayload(input: z.infer<typeof projectFieldsSchema>) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    description: input.description,
    client_name: input.clientName,
    year: input.year,
    tools: input.tools,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    status: input.status,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
  };
}

export async function saveProjectAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectFieldsSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    description: formData.get("description"),
    clientName: formData.get("clientName"),
    year: formData.get("year"),
    tools: splitList(formData.get("tools")),
    categoryIds: formData.getAll("categoryIds").filter((value) => typeof value === "string"),
    isFeatured: formData.get("isFeatured") === "on",
    sortOrder: formData.get("sortOrder") || "0",
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Le formulaire est incomplet.");
  }

  const links = readLinks(formData);
  if (!links.success) {
    return fail(links.error.issues[0]?.message ?? "Un lien externe est invalide.");
  }

  const supabase = await createSupabaseServerClient();
  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId.length > 0 ? rawId : null;
  if (id && !z.uuid().safeParse(id).success) return fail("Projet introuvable.");
  if (!(await uniqueSlug(supabase, parsed.data.slug, id ?? undefined))) {
    return fail("Cette adresse de page est déjà utilisée.");
  }

  if (!id) {
    const { data, error } = await supabase
      .from("projects")
      .insert(projectPayload(parsed.data))
      .select("id")
      .single();
    if (error || !data) return fail("Le projet n'a pas pu être créé.");

    const categoryError = await replaceCategories(supabase, data.id, parsed.data.categoryIds);
    if (categoryError) return fail(categoryError === "categories" ? "Les catégories n'ont pas été associées." : categoryError);

    const mediaError = await syncVisibility(supabase, data.id, parsed.data.status);
    if (mediaError) return fail(mediaError);

    const linkWarning = links.data.length > 0 ? await saveLinks(supabase, data.id, links.data) : null;
    refreshPublicContent(parsed.data.slug);
    redirect(`/admin/projets/${data.id}?etape=2&notice=${linkWarning ? "liens" : "cree"}`);
  }

  const { error } = await supabase.from("projects").update(projectPayload(parsed.data)).eq("id", id);
  if (error) {
    if (error.code === "23505") return fail("Cette adresse de page est déjà utilisée.");
    return fail("Le projet n'a pas pu être enregistré.");
  }

  const categoryError = await replaceCategories(supabase, id, parsed.data.categoryIds);
  if (categoryError) return fail(categoryError === "categories" ? "Les catégories n'ont pas été associées." : categoryError);

  const mediaError = await syncVisibility(supabase, id, parsed.data.status);
  if (mediaError) return fail(mediaError);

  const linkWarning = await saveLinks(supabase, id, links.data);
  refreshPublicContent(parsed.data.slug);
  const next = formData.get("next");
  if (next === "2" || next === "3") {
    redirect(`/admin/projets/${id}?etape=${next}&notice=${linkWarning ? "liens" : "enregistre"}`);
  }
  return {
    ok: true,
    message: linkWarning ?? "Les informations sont enregistrées.",
  };
}

async function loadProject(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; slug: string; status: "draft" | "published" };
}

export async function publishProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/projets?erreur=introuvable");
  const supabase = await createSupabaseServerClient();
  const project = await loadProject(id);
  if (!project) redirect("/admin/projets?erreur=introuvable");

  const { error } = await supabase.from("projects").update({ status: "published" }).eq("id", id);
  const target = safeReturn(formData.get("returnTo"), `/admin/projets/${id}`);
  if (error) redirect(withQuery(target, "erreur=publication"));
  const mediaError = await syncVisibility(supabase, id, "published");
  refreshPublicContent(project.slug);
  redirect(withQuery(target, mediaError ? "erreur=medias" : "notice=publie"));
}

export async function unpublishProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/projets?erreur=introuvable");
  const supabase = await createSupabaseServerClient();
  const project = await loadProject(id);
  if (!project) redirect("/admin/projets?erreur=introuvable");
  const { error } = await supabase.from("projects").update({ status: "draft" }).eq("id", id);
  const target = safeReturn(formData.get("returnTo"), `/admin/projets/${id}`);
  if (error) redirect(withQuery(target, "erreur=depublication"));
  refreshPublicContent(project.slug);
  redirect(withQuery(target, "notice=depublie"));
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "oui") {
    redirect(`${safeReturn(formData.get("returnTo"), "/admin/projets")}?erreur=confirmation`);
  }
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/projets?erreur=introuvable");
  const supabase = await createSupabaseServerClient();
  const { data: media } = await supabase
    .from("project_media")
    .select("bucket, storage_path")
    .eq("project_id", id);
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) redirect("/admin/projets?erreur=suppression");

  const groups = new Map<string, string[]>();
  for (const item of media ?? []) {
    if (!item.bucket || !item.storage_path) continue;
    groups.set(item.bucket, [...(groups.get(item.bucket) ?? []), item.storage_path]);
  }
  for (const [bucket, paths] of groups) {
    await supabase.storage.from(bucket).remove(paths);
  }

  refreshPublicContent();
  redirect("/admin/projets?notice=supprime");
}

export async function duplicateProject(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/admin/projets?erreur=introuvable");
  const supabase = await createSupabaseServerClient();
  const { data: source, error } = await supabase
    .from("projects")
    .select(
      "title, slug, excerpt, description, client_name, year, tools, is_featured, sort_order, seo_title, seo_description, external_links",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !source) redirect("/admin/projets?erreur=introuvable");

  let slug = slugify(`${source.slug}-copie`);
  for (let index = 2; !(await uniqueSlug(supabase, slug)); index += 1) {
    slug = slugify(`${source.slug}-copie-${index}`);
  }

  const { data: copy, error: insertError } = await supabase
    .from("projects")
    .insert({
      ...source,
      tools: source.tools ?? [],
      title: `${source.title} (copie)`,
      slug,
      status: "draft",
      is_featured: false,
    })
    .select("id")
    .single();
  if (insertError || !copy) redirect(`/admin/projets/${id}?erreur=duplication`);

  const { data: categories } = await supabase
    .from("project_categories")
    .select("category_id, sort_order")
    .eq("project_id", id);
  if ((categories ?? []).length > 0) {
    await supabase.from("project_categories").insert(
      (categories ?? []).map((category) => ({
        project_id: copy.id,
        category_id: category.category_id,
        sort_order: category.sort_order,
      })),
    );
  }

  const { data: media } = await supabase
    .from("project_media")
    .select(
      "id, bucket, storage_path, mime_type, kind, byte_size, alt_text, caption, role, sort_order, provider, external_url, external_id, poster_media_id",
    )
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  const idMap = new Map<string, string>();
  const copiedFiles: { bucket: string; path: string }[] = [];

  for (const item of media ?? []) {
    const newId = crypto.randomUUID();
    idMap.set(item.id, newId);
    const bucket: string | null = item.bucket;
    let storagePath: string | null = item.storage_path;

    if (item.provider === "storage" && item.bucket && item.storage_path) {
      const extension = item.storage_path.split(".").pop() ?? "bin";
      storagePath = `projects/${copy.id}/${crypto.randomUUID()}.${extension}`;
      const { error: copyError } = await supabase.storage.from(item.bucket).copy(item.storage_path, storagePath);
      if (copyError) {
        for (const file of copiedFiles) await supabase.storage.from(file.bucket).remove([file.path]);
        await supabase.from("projects").delete().eq("id", copy.id);
        redirect(`/admin/projets/${id}?erreur=duplication`);
      }
      copiedFiles.push({ bucket: item.bucket, path: storagePath });
    }

    const { error: mediaError } = await supabase.from("project_media").insert({
      id: newId,
      project_id: copy.id,
      bucket,
      storage_path: storagePath,
      mime_type: item.mime_type,
      kind: item.kind,
      byte_size: item.byte_size,
      alt_text: item.alt_text,
      caption: item.caption,
      role: item.role,
      sort_order: item.sort_order,
      visibility: "private",
      provider: item.provider,
      external_url: item.external_url,
      external_id: item.external_id,
      poster_media_id: null,
      created_by: admin.id,
    });
    if (mediaError) {
      for (const file of copiedFiles) await supabase.storage.from(file.bucket).remove([file.path]);
      await supabase.from("projects").delete().eq("id", copy.id);
      redirect(`/admin/projets/${id}?erreur=duplication`);
    }
  }

  for (const item of media ?? []) {
    if (!item.poster_media_id) continue;
    const posterId = idMap.get(item.poster_media_id);
    const mediaId = idMap.get(item.id);
    if (!posterId || !mediaId) continue;
    await supabase.from("project_media").update({ poster_media_id: posterId }).eq("id", mediaId);
  }

  revalidatePath("/admin/projets");
  redirect(`/admin/projets/${copy.id}?notice=copie`);
}
