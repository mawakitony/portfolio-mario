"use client";

import { Play, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoEmbed } from "@/components/site/video-embed";
import type { PublicMedia, PublicProject } from "@/lib/portfolio/queries";
import { cn } from "@/lib/utils";

const pageSize = 6;

export function WorkGallery({
  projects,
  unavailable,
  initialCategory,
}: {
  projects: PublicProject[];
  unavailable: boolean;
  initialCategory?: string;
}) {
  const ordered = useMemo(
    () => [...projects].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder),
    [projects],
  );
  const categories = useMemo(() => uniqueCategories(ordered), [ordered]);
  const validInitial = categories.some((category) => category.slug === initialCategory)
    ? initialCategory
    : undefined;
  const [category, setCategory] = useState(validInitial);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [opened, setOpened] = useState<PublicProject | null>(null);
  const close = useCallback(() => setOpened(null), []);

  const filtered = category
    ? ordered.filter((project) => project.categories.some((item) => item.slug === category))
    : ordered;
  const visible = filtered.slice(0, visibleCount);

  function choose(next: string | undefined) {
    setCategory(next);
    setVisibleCount(pageSize);
  }

  if (unavailable) {
    return (
      <Empty
        title="Les images sont indisponibles."
        body="La galerie n'a pas pu être chargée. Réessaie dans un instant."
      />
    );
  }

  return (
    <div>
      {categories.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2" role="navigation" aria-label="Filtrer par catégorie">
          <FilterButton current={!category} onClick={() => choose(undefined)}>
            Tout
          </FilterButton>
          {categories.map((item) => (
            <FilterButton key={item.slug} current={category === item.slug} onClick={() => choose(item.slug)}>
              {item.name}
            </FilterButton>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <Empty
          title={category ? "Aucune publication dans cette catégorie." : "Aucune image publiée."}
          body="Les publications en ligne apparaîtront ici."
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project, index) => (
            <ProjectTile
              key={project.id}
              project={project}
              wide={!category && index % 5 === 0}
              onOpen={() => setOpened(project)}
            />
          ))}
        </div>
      )}

      {visibleCount < filtered.length ? (
        <button
          type="button"
          className="mt-10 rounded-full border border-white/15 px-5 py-3 text-sm font-medium"
          onClick={() => setVisibleCount((count) => count + pageSize)}
        >
          Afficher davantage
        </button>
      ) : null}

      {opened ? <ProjectSheet project={opened} onClose={close} /> : null}
    </div>
  );
}

function ProjectTile({
  project,
  wide,
  onOpen,
}: {
  project: PublicProject;
  wide: boolean;
  onOpen: () => void;
}) {
  const visual = visualOf(project);
  const hasVideo = videosOf(project).length > 0;
  const categories = project.categories.map((category) => category.name).join(" · ");

  return (
    <article className={cn(wide && "sm:col-span-2 xl:col-span-2")}>
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <span className="relative block aspect-[4/5] overflow-hidden border border-white/10 bg-card sm:aspect-[16/11]">
          {visual ? (
            <Image
              src={visual.src}
              alt={visual.alt}
              fill
              sizes={wide ? "(min-width: 1280px) 60vw, 100vw" : "(min-width: 1280px) 30vw, 100vw"}
              className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-end bg-[radial-gradient(circle_at_top,oklch(0.28_0.04_75),oklch(0.12_0.01_75))] p-6">
              <span className="font-display text-4xl">{project.title}</span>
            </span>
          )}
          {hasVideo ? (
            <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-background/80">
              <Play className="size-4 fill-current" aria-hidden />
              <span className="sr-only">Contient une vidéo</span>
            </span>
          ) : null}
        </span>
        <span className="mt-4 flex items-start justify-between gap-4">
          <span className="font-display text-3xl">{project.title}</span>
          {project.year ? <span className="pt-2 text-xs text-muted-foreground">{project.year}</span> : null}
        </span>
        {categories ? <span className="mt-2 block text-sm text-muted-foreground">{categories}</span> : null}
        {project.isFeatured ? <span className="mt-2 block text-xs font-medium text-brand">Vedette</span> : null}
      </button>
    </article>
  );
}

function ProjectSheet({ project, onClose }: { project: PublicProject; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const visual = visualOf(project);
  const gallery = project.media.filter((item) => item.kind === "image" && item.url && item.id !== coverImage(project)?.id);
  const videos = videosOf(project);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-sheet-title"
        className="mx-auto min-h-full w-full max-w-5xl bg-background px-6 py-8 md:px-10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {project.categories.map((category) => category.name).join(" · ") || "Publication"}
          </p>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-white/15" autoFocus>
            <X className="size-4" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>
        <h2 id="project-sheet-title" className="mt-6 font-display text-5xl md:text-7xl">
          {project.title}
        </h2>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {project.clientName ? <div>Client · {project.clientName}</div> : null}
          {project.year ? <div>Année · {project.year}</div> : null}
          {project.tools.length > 0 ? <div>Outils · {project.tools.join(", ")}</div> : null}
        </dl>
        {visual ? (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-card">
            <Image src={visual.src} alt={visual.alt} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
          </div>
        ) : null}
        {project.description ? (
          <div className="mt-8 grid gap-4">
            {project.description.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph} className="max-w-3xl leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        ) : null}
        {gallery.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {gallery.map((image) => (
              <div key={image.id} className="relative aspect-[4/3] overflow-hidden bg-card">
                <Image src={image.url ?? ""} alt={image.alt_text || project.title} fill sizes="50vw" className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
        {videos.length > 0 ? (
          <div className="mt-8 grid gap-6">
            {videos.map((media) => (
              <VideoEmbed key={media.id} media={media} project={project} />
            ))}
          </div>
        ) : null}
        <a href={`/portfolio/${project.slug}`} className="mt-8 inline-block text-sm font-medium underline underline-offset-4">
          Ouvrir la page partageable
        </a>
      </div>
    </div>
  );
}

function coverImage(project: PublicProject) {
  return (
    project.media.find((item) => item.role === "cover" && item.kind === "image" && item.url) ??
    project.media.find((item) => item.kind === "image" && item.url) ??
    null
  );
}

function videosOf(project: PublicProject): PublicMedia[] {
  return project.media.filter((item) => item.kind === "video" || item.kind === "embed");
}

function visualOf(project: PublicProject) {
  const cover = coverImage(project);
  if (cover?.url) return { src: cover.url, alt: cover.alt_text || project.title };
  const poster = project.media.find((item) => item.url && (item.kind === "poster" || item.role === "poster"));
  if (poster?.url) return { src: poster.url, alt: poster.alt_text || project.title };
  const youtube = videosOf(project).find((item) => item.provider === "youtube" && item.external_id);
  if (youtube?.external_id) {
    return { src: `https://i.ytimg.com/vi/${youtube.external_id}/hqdefault.jpg`, alt: project.title };
  }
  return null;
}

function uniqueCategories(projects: PublicProject[]) {
  const map = new Map<string, { name: string; slug: string }>();
  for (const project of projects) {
    for (const category of project.categories) map.set(category.slug, category);
  }
  return [...map.values()];
}

function FilterButton({
  current,
  onClick,
  children,
}: {
  current: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={current ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium",
        current ? "border-primary bg-primary text-primary-foreground" : "border-white/15 text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-white/15 px-6 py-16">
      <p className="font-display text-3xl">{title}</p>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
