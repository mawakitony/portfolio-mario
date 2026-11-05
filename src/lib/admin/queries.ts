import "server-only";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { agency } from "@/lib/content/agency";
import type {
  AdminCategory,
  AdminMedia,
  AdminMessage,
  AdminProjectListItem,
  AdminService,
  ExternalLink,
} from "@/lib/admin/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const categoryRow = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sort_order: z.number(),
});

const projectListRow = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  status: z.enum(["draft", "published"]),
  is_featured: z.boolean(),
  year: z.number().nullable(),
  sort_order: z.number(),
  updated_at: z.string(),
  project_categories: z
    .array(
      z.object({
        categories: z.union([
          z.object({ name: z.string(), slug: z.string() }),
          z.array(z.object({ name: z.string(), slug: z.string() })),
        ]).nullable(),
      }),
    )
    .nullable(),
});

const mediaRow = z.object({
  id: z.uuid(),
  project_id: z.uuid().nullable(),
  bucket: z.string().nullable(),
  storage_path: z.string().nullable(),
  mime_type: z.string().nullable(),
  kind: z.enum(["image", "video", "poster", "embed"]),
  byte_size: z.preprocess(
    (value) => (value === null || value === undefined || value === "" ? null : Number(value)),
    z.number().nullable(),
  ),
  alt_text: z.string().nullable(),
  caption: z.string().nullable(),
  role: z.enum(["cover", "gallery", "video", "document", "poster"]),
  sort_order: z.number(),
  visibility: z.enum(["private", "public"]),
  provider: z.enum(["storage", "youtube", "vimeo"]),
  external_url: z.string().nullable(),
  external_id: z.string().nullable(),
  poster_media_id: z.uuid().nullable(),
  projects: z.union([z.object({ title: z.string() }), z.array(z.object({ title: z.string() }))]).nullable(),
});

const messageRow = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  subject: z.string().nullable(),
  message: z.string(),
  status: z.enum(["new", "read", "archived"]),
  created_at: z.string(),
});

const serviceRow = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  items: z.array(z.string()).nullable(),
  sort_order: z.number(),
  status: z.enum(["draft", "published"]),
});

async function client() {
  await requireAdmin();
  return createSupabaseServerClient();
}

async function countRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "projects" | "contact_messages" | "categories" | "project_views",
  filters: Record<string, string> = {},
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) return null;
  return count ?? 0;
}

function linkedCategories(row: z.infer<typeof projectListRow>) {
  return (row.project_categories ?? []).flatMap((link) => {
    if (!link.categories) return [];
    return Array.isArray(link.categories) ? link.categories : [link.categories];
  });
}

function projectTitle(value: z.infer<typeof mediaRow>["projects"]) {
  if (!value) return null;
  return Array.isArray(value) ? value[0]?.title ?? null : value.title;
}

async function withUrls(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: z.infer<typeof mediaRow>[],
): Promise<AdminMedia[]> {
  return Promise.all(
    rows.map(async (row) => {
      let url: string | null = null;
      if (row.provider === "storage" && row.bucket && row.storage_path) {
        const { data } = await supabase.storage.from(row.bucket).createSignedUrl(row.storage_path, 60 * 10);
        url = data?.signedUrl ?? null;
      }
      return {
        id: row.id,
        projectId: row.project_id,
        projectTitle: projectTitle(row.projects),
        bucket: row.bucket,
        storagePath: row.storage_path,
        mimeType: row.mime_type,
        kind: row.kind,
        byteSize: row.byte_size,
        altText: row.alt_text,
        caption: row.caption,
        role: row.role,
        sortOrder: row.sort_order,
        visibility: row.visibility,
        provider: row.provider,
        externalUrl: row.external_url,
        externalId: row.external_id,
        posterMediaId: row.poster_media_id,
        url,
      };
    }),
  );
}

const coverRow = z.object({
  project_id: z.uuid(),
  bucket: z.string().nullable(),
  storage_path: z.string().nullable(),
  provider: z.enum(["storage", "youtube", "vimeo"]),
  external_id: z.string().nullable(),
  role: z.enum(["cover", "gallery", "video", "document", "poster"]),
  kind: z.enum(["image", "video", "poster", "embed"]),
  sort_order: z.number(),
});

async function coverUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: z.infer<typeof coverRow>[],
) {
  const images = rows.filter(
    (row) => row.kind === "image" && row.provider === "storage" && row.bucket && row.storage_path,
  );
  const chosen = images.find((row) => row.role === "cover") ?? images[0];
  if (chosen?.bucket && chosen.storage_path) {
    const { data } = await supabase.storage.from(chosen.bucket).createSignedUrl(chosen.storage_path, 60 * 10);
    return data?.signedUrl ?? null;
  }
  const youtube = rows.find((row) => row.provider === "youtube" && row.external_id);
  if (youtube?.external_id) return `https://i.ytimg.com/vi/${youtube.external_id}/hqdefault.jpg`;
  return null;
}

export async function getDashboard() {
  const supabase = await client();
  const [published, drafts, messages] = await Promise.all([
    countRows(supabase, "projects", { status: "published" }),
    countRows(supabase, "projects", { status: "draft" }),
    countRows(supabase, "contact_messages"),
  ]);

  const projectQuery = await supabase
    .from("projects")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(6);
  const parsed = z
    .array(
      z.object({
        id: z.uuid(),
        title: z.string(),
        status: z.enum(["draft", "published"]),
        updated_at: z.string(),
      }),
    )
    .safeParse(projectQuery.data ?? []);

  if (projectQuery.error || !parsed.success) {
    return {
      counts: {
        projects: published === null || drafts === null ? null : published + drafts,
        published,
        drafts,
        messages,
      },
      projects: null,
    };
  }

  const ids = parsed.data.map((project) => project.id);
  const grouped = new Map<string, z.infer<typeof coverRow>[]>();
  if (ids.length > 0) {
    const mediaQuery = await supabase
      .from("project_media")
      .select("project_id, bucket, storage_path, provider, external_id, role, kind, sort_order")
      .in("project_id", ids)
      .order("sort_order", { ascending: true });
    const media = z.array(coverRow).safeParse(mediaQuery.data ?? []);
    if (media.success) {
      for (const row of media.data) {
        const list = grouped.get(row.project_id) ?? [];
        list.push(row);
        grouped.set(row.project_id, list);
      }
    }
  }

  const covers = new Map<string, string | null>();
  await Promise.all(
    parsed.data.map(async (project) => {
      covers.set(project.id, await coverUrl(supabase, grouped.get(project.id) ?? []));
    }),
  );

  return {
    counts: {
      projects: published === null || drafts === null ? null : published + drafts,
      published,
      drafts,
      messages,
    },
    projects: parsed.data.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      updatedAt: project.updated_at,
      coverUrl: covers.get(project.id) ?? null,
    })),
  };
}

export async function listCategories(): Promise<AdminCategory[] | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order")
    .order("sort_order", { ascending: true });
  if (error) return null;
  const parsed = z.array(categoryRow).safeParse(data ?? []);
  if (!parsed.success) return null;
  return parsed.data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

export async function listProjects(filters: {
  status?: string;
  category?: string;
  query?: string;
  sort?: string;
}): Promise<AdminProjectListItem[] | null> {
  const supabase = await client();
  let query = supabase
    .from("projects")
    .select(
      "id, title, slug, status, is_featured, year, sort_order, updated_at, project_categories (categories (name, slug))",
    );
  if (filters.sort === "ancien") query = query.order("updated_at", { ascending: true });
  else if (filters.sort === "recent") query = query.order("updated_at", { ascending: false });
  else query = query.order("sort_order", { ascending: true });

  if (filters.status === "draft" || filters.status === "published") query = query.eq("status", filters.status);
  const term = (filters.query ?? "").replace(/[%_,]/g, "").trim();
  if (term) query = query.ilike("title", `%${term}%`);

  const { data, error } = await query;
  if (error) return null;
  const parsed = z.array(projectListRow).safeParse(data ?? []);
  if (!parsed.success) return null;

  const items = parsed.data.flatMap((row) => {
    const categories = linkedCategories(row);
    if (filters.category && !categories.some((category) => category.slug === filters.category)) return [];
    return [
      {
        id: row.id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        isFeatured: row.is_featured,
        year: row.year,
        sortOrder: row.sort_order,
        updatedAt: row.updated_at,
        categories: categories.map((category) => category.name),
      },
    ];
  });
  const covers = await coversFor(supabase, items.map((item) => item.id));
  return items.map((item) => ({ ...item, coverUrl: covers.get(item.id) ?? null }));
}

async function coversFor(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ids: string[],
) {
  const covers = new Map<string, string | null>();
  if (ids.length === 0) return covers;
  const mediaQuery = await supabase
    .from("project_media")
    .select("project_id, bucket, storage_path, provider, external_id, role, kind, sort_order")
    .in("project_id", ids)
    .order("sort_order", { ascending: true });
  const media = z.array(coverRow).safeParse(mediaQuery.data ?? []);
  const grouped = new Map<string, z.infer<typeof coverRow>[]>();
  if (media.success) {
    for (const row of media.data) {
      const list = grouped.get(row.project_id) ?? [];
      list.push(row);
      grouped.set(row.project_id, list);
    }
  }
  await Promise.all(
    ids.map(async (id) => {
      covers.set(id, await coverUrl(supabase, grouped.get(id) ?? []));
    }),
  );
  return covers;
}

export async function getAdminProject(id: string) {
  if (!z.uuid().safeParse(id).success) return { ok: false as const, reason: "missing" as const };
  const supabase = await client();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, title, slug, excerpt, description, client_name, year, tools, status, is_featured,
       sort_order, seo_title, seo_description, project_categories (category_id)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) return { ok: false as const, reason: "error" as const };
  if (!data) return { ok: false as const, reason: "missing" as const };

  const parsed = z
    .object({
      id: z.uuid(),
      title: z.string(),
      slug: z.string(),
      excerpt: z.string().nullable(),
      description: z.string().nullable(),
      client_name: z.string().nullable(),
      year: z.number().nullable(),
      tools: z.array(z.string()).nullable(),
      status: z.enum(["draft", "published"]),
      is_featured: z.boolean(),
      sort_order: z.number(),
      seo_title: z.string().nullable(),
      seo_description: z.string().nullable(),
      project_categories: z.array(z.object({ category_id: z.uuid() })).nullable(),
    })
    .safeParse(data);
  if (!parsed.success) return { ok: false as const, reason: "error" as const };

  const linksQuery = await supabase.from("projects").select("external_links").eq("id", id).maybeSingle();
  const links = z.array(z.object({ label: z.string(), url: z.url() })).safeParse(linksQuery.data?.external_links);

  return {
    ok: true as const,
    project: parsed.data,
    categoryIds: (parsed.data.project_categories ?? []).map((link) => link.category_id),
    links: links.success ? (links.data as ExternalLink[]) : [],
    linksAvailable: !linksQuery.error,
  };
}

export async function listProjectMedia(projectId: string): Promise<AdminMedia[] | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("project_media")
    .select(
      `id, project_id, bucket, storage_path, mime_type, kind, byte_size, alt_text, caption, role,
       sort_order, visibility, provider, external_url, external_id, poster_media_id, projects!project_id (title)`,
    )
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) return null;
  const parsed = z.array(mediaRow).safeParse(data ?? []);
  if (!parsed.success) return null;
  return withUrls(supabase, parsed.data);
}

export async function listLibrary(projectFilter: string, kind?: string): Promise<AdminMedia[] | null> {
  const supabase = await client();
  let query = supabase
    .from("project_media")
    .select(
      `id, project_id, bucket, storage_path, mime_type, kind, byte_size, alt_text, caption, role,
       sort_order, visibility, provider, external_url, external_id, poster_media_id, projects!project_id (title)`,
    )
    .order("created_at", { ascending: false })
    .limit(80);

  if (projectFilter === "libres") query = query.is("project_id", null);
  else if (z.uuid().safeParse(projectFilter).success) query = query.eq("project_id", projectFilter);
  if (kind === "image") query = query.eq("kind", "image");
  if (kind === "video") query = query.in("kind", ["video", "embed"]);

  const { data, error } = await query;
  if (error) return null;
  const parsed = z.array(mediaRow).safeParse(data ?? []);
  if (!parsed.success) return null;
  return withUrls(supabase, parsed.data);
}

export async function listMessages(filters: { status?: string; query?: string }): Promise<AdminMessage[] | null> {
  const supabase = await client();
  let query = supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, status, created_at")
    .order("created_at", { ascending: false });
  if (filters.status === "new" || filters.status === "read" || filters.status === "archived") {
    query = query.eq("status", filters.status);
  }
  const term = (filters.query ?? "").replace(/[%_,]/g, "").trim();
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,subject.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) return null;
  const parsed = z.array(messageRow).safeParse(data ?? []);
  if (!parsed.success) return null;
  return parsed.data.map(toMessage);
}

export async function getMessage(id: string): Promise<AdminMessage | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await client();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = messageRow.safeParse(data);
  return parsed.success ? toMessage(parsed.data) : null;
}

function toMessage(row: z.infer<typeof messageRow>): AdminMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listServices(): Promise<AdminService[] | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, summary, body, items, sort_order, status")
    .order("sort_order", { ascending: true });
  if (error) return null;
  const parsed = z.array(serviceRow).safeParse(data ?? []);
  if (!parsed.success) return null;
  return parsed.data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    items: row.items ?? [],
    sortOrder: row.sort_order,
    status: row.status,
  }));
}

const identitySchema = z.object({
  name: z.string(),
  legalName: z.string(),
  signature: z.string(),
  director: z.string(),
  role: z.string(),
  promise: z.string(),
});

export async function getSettingsForm() {
  const supabase = await client();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  const values = new Map((data ?? []).map((row) => [row.key as string, row.value]));
  const identity = identitySchema.safeParse(values.get("identity"));
  const about = z.object({ text: z.string() }).safeParse(values.get("about"));
  const contact = z.object({ email: z.string(), phones: z.string(), location: z.string() }).safeParse(values.get("contact"));
  const social = z
    .object({
      instagram: z.string().nullable().optional(),
      facebook: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
      behance: z.string().nullable().optional(),
      youtube: z.string().nullable().optional(),
      tiktok: z.string().nullable().optional(),
    })
    .safeParse(values.get("social"));
  const seo = z.object({ title: z.string().nullable(), description: z.string().nullable() }).safeParse(values.get("seo"));
  const branding = z
    .object({
      logo: z.object({ bucket: z.string(), path: z.string() }).nullable().optional(),
      portrait: z.object({ bucket: z.string(), path: z.string() }).nullable().optional(),
    })
    .safeParse(values.get("branding"));

  async function sign(asset: { bucket: string; path: string } | null | undefined) {
    if (!asset) return null;
    const { data: signed } = await supabase.storage.from(asset.bucket).createSignedUrl(asset.path, 60 * 10);
    return signed?.signedUrl ?? null;
  }

  return {
    loaded: !error,
    name: identity.success ? identity.data.name : agency.name,
    legalName: identity.success ? identity.data.legalName : agency.legalName,
    signature: identity.success ? identity.data.signature : agency.signature,
    director: identity.success ? identity.data.director : agency.director,
    role: identity.success ? identity.data.role : agency.role,
    promise: identity.success ? identity.data.promise : agency.promise,
    about: about.success ? about.data.text : agency.about.join("\n\n"),
    email: contact.success ? contact.data.email : agency.email,
    phones: contact.success ? contact.data.phones : agency.phones.map((phone) => phone.display).join("\n"),
    location: contact.success ? contact.data.location : agency.location,
    instagram: social.success ? social.data.instagram ?? "" : "",
    facebook: social.success ? social.data.facebook ?? "" : "",
    linkedin: social.success ? social.data.linkedin ?? "" : "",
    behance: social.success ? social.data.behance ?? "" : "",
    youtube: social.success ? social.data.youtube ?? "" : "",
    tiktok: social.success ? social.data.tiktok ?? "" : "",
    seoTitle: seo.success ? seo.data.title ?? "" : "",
    seoDescription: seo.success ? seo.data.description ?? "" : "",
    logoUrl: await sign(branding.success ? branding.data.logo : null),
    portraitUrl: await sign(branding.success ? branding.data.portrait : null),
  };
}
