import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoEmbed } from "@/components/site/video-embed";
import { getAdminProject, listProjectMedia } from "@/lib/admin/queries";
import type { PublicMedia, PublicProject } from "@/lib/portfolio/queries";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, media] = await Promise.all([getAdminProject(id), listProjectMedia(id)]);
  if (!result.ok && result.reason === "missing") notFound();
  if (!result.ok || media === null) {
    return <p className="text-sm text-destructive">La prévisualisation est indisponible.</p>;
  }

  const project = result.project;
  const publicMedia: PublicMedia[] = media.map((item) => ({
    id: item.id,
    bucket: item.bucket,
    storage_path: item.storagePath,
    mime_type: item.mimeType,
    kind: item.kind,
    alt_text: item.altText,
    caption: item.caption,
    role: item.role,
    sort_order: item.sortOrder,
    visibility: item.visibility,
    provider: item.provider,
    external_url: item.externalUrl,
    external_id: item.externalId,
    poster_media_id: item.posterMediaId,
    url: item.url,
  }));
  const preview: PublicProject = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    excerpt: project.excerpt,
    description: project.description,
    clientName: project.client_name,
    year: project.year,
    tools: project.tools ?? [],
    isFeatured: project.is_featured,
    sortOrder: project.sort_order,
    seoTitle: project.seo_title,
    seoDescription: project.seo_description,
    categories: [],
    media: publicMedia,
    likeCount: null,
  };

  return (
    <main className="grid max-w-4xl gap-8">
      <p className="text-xs tracking-[0.18em] text-brand uppercase">
        Prévisualisation {project.status === "published" ? "publique" : "privée"}
      </p>
      <h1 className="font-display text-6xl tracking-tight">{project.title}</h1>
      {project.excerpt ? <p className="text-lg text-muted-foreground">{project.excerpt}</p> : null}
      <dl className="grid gap-3 text-sm">
        <div>Client : {project.client_name || "—"}</div>
        <div>Année : {project.year ?? "—"}</div>
        <div>Outils : {(project.tools ?? []).join(", ") || "—"}</div>
      </dl>
      {project.description?.split(/\n{2,}/).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <div className="grid gap-4">
        {publicMedia.map((item) =>
          item.kind === "video" || item.kind === "embed" ? (
            <VideoEmbed key={item.id} media={item} project={preview} />
          ) : item.url ? (
            <Image key={item.id} src={item.url} alt={item.alt_text ?? project.title} width={1600} height={1000} className="h-auto w-full" />
          ) : null,
        )}
      </div>
      {result.links.length > 0 ? (
        <ul className="grid gap-2 text-sm">
          {result.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} className="underline underline-offset-4">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href={`/admin/projets/${project.id}`} className="text-sm underline underline-offset-4">
        Revenir à l&apos;édition
      </Link>
    </main>
  );
}
