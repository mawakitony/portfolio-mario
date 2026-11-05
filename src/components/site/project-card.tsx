import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { coverOf, videosOf, type PublicProject } from "@/lib/portfolio/queries";

export function ProjectCard({
  project,
  featured = false,
}: {
  project: PublicProject;
  featured?: boolean;
}) {
  const cover = coverOf(project);
  const hasVideo = videosOf(project).length > 0;
  const meta = [project.clientName, project.year?.toString(), project.categories[0]?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={featured ? "md:col-span-7" : "md:col-span-5"}>
      <Link href={`/portfolio/${project.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-card md:aspect-[16/11]">
          {cover?.url ? (
            <Image
              src={cover.url}
              alt={cover.alt_text || project.title}
              fill
              sizes={featured ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 40vw, 100vw"}
              className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-end p-6">
              <p className="font-display text-4xl">{project.title}</p>
            </div>
          )}
          {hasVideo ? (
            <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-background/80 text-foreground">
              <Play className="size-4 fill-current" aria-hidden />
              <span className="sr-only">Contient une vidéo</span>
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-3xl tracking-tight">{project.title}</h3>
          {meta ? <p className="pt-2 text-right text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        {project.excerpt ? (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{project.excerpt}</p>
        ) : null}
      </Link>
    </article>
  );
}
