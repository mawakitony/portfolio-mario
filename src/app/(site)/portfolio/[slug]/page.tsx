import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyPanel } from "@/components/site/empty-panel";
import { LikeButton } from "@/components/site/like-button";
import { ProjectCard } from "@/components/site/project-card";
import { VideoEmbed } from "@/components/site/video-embed";
import {
  coverOf,
  getProjectExternalLinks,
  getPublishedProject,
  getPublishedProjects,
  videosOf,
  type PublicProject,
} from "@/lib/portfolio/queries";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedProject(slug);
  if (!result.ok || !result.data) return { title: "Projet" };
  const project = result.data;
  const cover = coverOf(project);
  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.excerpt || undefined,
    openGraph: cover?.url ? { images: [{ url: cover.url, alt: cover.alt_text || project.title }] } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const [projectResult, listResult] = await Promise.all([
    getPublishedProject(slug),
    getPublishedProjects(),
  ]);

  if (!projectResult.ok) {
    return (
      <main className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10">
        <EmptyPanel
          title="Cette page est indisponible."
          body="La fiche n'a pas pu être chargée. Réessaie dans un instant."
        />
      </main>
    );
  }

  if (!projectResult.data) notFound();
  const project = projectResult.data;
  const links = await getProjectExternalLinks(project.id);
  const cover = coverOf(project);
  const gallery = project.media.filter((item) => item.kind === "image" && item.id !== cover?.id && item.url);
  const videos = videosOf(project);
  const published = listResult.ok ? listResult.data : [];
  const similar = similarProjects(project, published);
  const currentIndex = published.findIndex((item) => item.id === project.id);
  const next = currentIndex >= 0 && published.length > 1 ? published[(currentIndex + 1) % published.length] : null;

  return (
    <main>
      <header className="mx-auto w-full max-w-7xl px-6 pt-16 pb-10 md:px-10">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          {project.categories.map((category) => category.name).join(" · ") || "Projet"}
        </p>
        <h1 className="mt-4 max-w-5xl font-display text-6xl tracking-tight md:text-8xl">{project.title}</h1>
        {project.excerpt ? (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{project.excerpt}</p>
        ) : null}
        <div className="mt-6">
          <LikeButton projectId={project.id} count={project.likeCount} />
        </div>
      </header>

      {cover?.url ? (
        <div className="relative mx-auto aspect-[16/9] w-full max-w-7xl overflow-hidden bg-card md:px-10">
          <Image
            src={cover.url}
            alt={cover.alt_text || project.title}
            fill
            priority
            sizes="(min-width: 1280px) 1120px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-10">
        <dl className="grid content-start gap-6 text-sm">
          <Meta term="Client" value={project.clientName} />
          <Meta term="Année" value={project.year?.toString() ?? null} />
          <Meta term="Outils" value={project.tools.length > 0 ? project.tools.join(", ") : null} />
          {links.length > 0 ? (
            <div>
              <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Liens</dt>
              <dd className="mt-2 grid gap-2">
                {links.map((link) => (
                  <a key={link.url} href={link.url} className="underline underline-offset-4">
                    {link.label}
                  </a>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="grid gap-5">
          {paragraphs(project.description).map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {gallery.length > 0 ? (
        <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-16 md:grid-cols-2 md:px-10">
          {gallery.map((image) => (
            <figure key={image.id} className="relative aspect-[4/3] overflow-hidden bg-card">
              <Image
                src={image.url ?? ""}
                alt={image.alt_text || project.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              {image.caption ? (
                <figcaption className="sr-only">{image.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 pb-16 md:px-10">
          <h2 className="font-display text-4xl">Images en mouvement</h2>
          {videos.map((media) => (
            <VideoEmbed key={media.id} media={media} project={project} />
          ))}
        </section>
      ) : null}

      {similar.length > 0 ? (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
            <h2 className="font-display text-4xl">Projets proches</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-12">
              {similar.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 pb-16 md:px-10">
        <Link href="/#realisations" className="text-sm font-medium underline underline-offset-4">
          Retour aux images
        </Link>
        {next ? (
          <Link href={`/portfolio/${next.slug}`} className="text-right">
            <span className="block text-xs tracking-[0.18em] text-muted-foreground uppercase">Projet suivant</span>
            <span className="mt-1 block font-display text-3xl">{next.title}</span>
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function Meta({ term, value }: { term: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{term}</dt>
      <dd className="mt-2">{value}</dd>
    </div>
  );
}

function paragraphs(value: string | null) {
  if (!value) return [];
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function similarProjects(project: PublicProject, projects: PublicProject[]) {
  const slugs = new Set(project.categories.map((category) => category.slug));
  if (slugs.size === 0) return [];
  return projects
    .filter(
      (item) =>
        item.id !== project.id && item.categories.some((category) => slugs.has(category.slug)),
    )
    .slice(0, 3);
}
