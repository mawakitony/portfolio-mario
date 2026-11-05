import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicContentCache } from "@/lib/content/public-cache";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const categorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  sort_order: z.number(),
});

const mediaSchema = z.object({
  id: z.string(),
  bucket: z.string().nullable(),
  storage_path: z.string().nullable(),
  mime_type: z.string().nullable(),
  kind: z.enum(["image", "video", "poster", "embed"]),
  alt_text: z.string().nullable(),
  caption: z.string().nullable(),
  role: z.enum(["cover", "gallery", "video", "document", "poster"]),
  sort_order: z.number(),
  visibility: z.enum(["private", "public"]),
  provider: z.enum(["storage", "youtube", "vimeo"]),
  external_url: z.string().nullable(),
  external_id: z.string().nullable(),
  poster_media_id: z.string().nullable(),
});

const projectRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  description: z.string().nullable(),
  client_name: z.string().nullable(),
  year: z.number().nullable(),
  tools: z.array(z.string()).nullable(),
  is_featured: z.boolean(),
  sort_order: z.number(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  project_categories: z
    .array(
      z.object({
        sort_order: z.number(),
        categories: z.union([categorySchema, z.array(categorySchema)]).nullable(),
      }),
    )
    .nullable(),
  project_media: z.array(mediaSchema).nullable(),
});

const serviceRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  items: z.array(z.string()).nullable(),
  sort_order: z.number(),
});

export type PublicCategory = {
  name: string;
  slug: string;
  sortOrder: number;
};

export type PublicMedia = z.infer<typeof mediaSchema> & {
  url: string | null;
};

export type PublicProject = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  clientName: string | null;
  year: number | null;
  tools: string[];
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  categories: PublicCategory[];
  media: PublicMedia[];
  likeCount: number | null;
};

export type PublicService = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  items: string[];
  sortOrder: number;
};

export type LoadResult<T> = { ok: true; data: T } | { ok: false };

const projectSelect = `
  id, title, slug, excerpt, description, client_name, year, tools,
  is_featured, sort_order, seo_title, seo_description,
  project_categories (sort_order, categories (name, slug, sort_order)),
  project_media (
    id, bucket, storage_path, mime_type, kind, alt_text, caption, role,
    sort_order, visibility, provider, external_url, external_id, poster_media_id
  )
`;

function asCategories(
  value: z.infer<typeof projectRowSchema>["project_categories"],
): PublicCategory[] {
  const links = value ?? [];
  return links
    .flatMap((link) => {
      if (!link.categories) return [];
      const categories = Array.isArray(link.categories) ? link.categories : [link.categories];
      return categories.map((category) => ({
        name: category.name,
        slug: category.slug,
        sortOrder: category.sort_order,
      }));
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"));
}

async function signMedia(
  media: z.infer<typeof mediaSchema>[],
): Promise<PublicMedia[]> {
  const visible = media
    .filter((item) => item.visibility === "public")
    .sort((a, b) => a.sort_order - b.sort_order);
  const supabase = createSupabasePublicClient();

  return Promise.all(
    visible.map(async (item) => {
      if (item.provider !== "storage" || !item.bucket || !item.storage_path) {
        return { ...item, url: null };
      }
      const { data } = await supabase.storage
        .from(item.bucket)
        .createSignedUrl(item.storage_path, 60 * 10);
      return { ...item, url: data?.signedUrl ?? null };
    }),
  );
}

function normalizeProject(
  row: z.infer<typeof projectRowSchema>,
  media: PublicMedia[],
): PublicProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    description: row.description,
    clientName: row.client_name,
    year: row.year,
    tools: row.tools ?? [],
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    categories: asCategories(row.project_categories),
    media,
    likeCount: null,
  };
}

export function coverOf(project: PublicProject): PublicMedia | null {
  return (
    project.media.find((item) => item.role === "cover" && item.kind === "image" && item.url) ??
    project.media.find((item) => item.kind === "image" && item.url) ??
    null
  );
}

export function videosOf(project: PublicProject): PublicMedia[] {
  return project.media.filter((item) => item.kind === "video" || item.kind === "embed");
}

export async function getPublishedProjects(): Promise<LoadResult<PublicProject[]>> {
  "use cache";
  cacheTag("projects");
  cacheLife(publicContentCache);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select(projectSelect)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("projects", error.code);
    return { ok: false };
  }

  const parsed = z.array(projectRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("projects.shape");
    return { ok: false };
  }

  const projects = await Promise.all(
    parsed.data.map(async (row) => normalizeProject(row, await signMedia(row.project_media ?? []))),
  );
  const withLikes = await attachLikeCounts(supabase, projects);

  return {
    ok: true,
    data: withLikes.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "fr")),
  };
}

async function attachLikeCounts(
  supabase: ReturnType<typeof createSupabasePublicClient>,
  projects: PublicProject[],
) {
  if (projects.length === 0) return projects;
  const { data, error } = await supabase
    .from("project_likes")
    .select("project_id")
    .in("project_id", projects.map((project) => project.id));
  if (error) return projects.map((project) => ({ ...project, likeCount: null }));
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String(row.project_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return projects.map((project) => ({ ...project, likeCount: counts.get(project.id) ?? 0 }));
}

export async function getPublishedProject(
  slug: string,
): Promise<LoadResult<PublicProject | null>> {
  const result = await getPublishedProjects();
  if (!result.ok) return result;
  return { ok: true, data: result.data.find((project) => project.slug === slug) ?? null };
}

export async function getPublishedServices(): Promise<LoadResult<PublicService[]>> {
  "use cache";
  cacheTag("services");
  cacheLife(publicContentCache);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, summary, body, items, sort_order")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("services", error.code);
    return { ok: false };
  }

  const parsed = z.array(serviceRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("services.shape");
    return { ok: false };
  }

  return {
    ok: true,
    data: parsed.data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      body: row.body,
      items: row.items ?? [],
      sortOrder: row.sort_order,
    })),
  };
}

const externalLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.url().max(500),
});

export async function getProjectExternalLinks(projectId: string) {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("external_links")
    .eq("id", projectId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return [];
  const parsed = z.array(externalLinkSchema).safeParse(data.external_links);
  return parsed.success ? parsed.data : [];
}
