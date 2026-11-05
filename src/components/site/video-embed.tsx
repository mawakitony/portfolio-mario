"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { PublicMedia, PublicProject } from "@/lib/portfolio/queries";

export function embedSrc(media: PublicMedia) {
  if (!media.external_id) return null;
  if (media.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(media.external_id)}`;
  }
  if (media.provider === "vimeo") {
    return `https://player.vimeo.com/video/${encodeURIComponent(media.external_id)}`;
  }
  return null;
}

export function videoCover(project: PublicProject, media: PublicMedia) {
  const poster = project.media.find((item) => item.id === media.poster_media_id)?.url ?? null;
  if (poster) return poster;
  if (media.provider === "youtube" && media.external_id) {
    return `https://i.ytimg.com/vi/${media.external_id}/hqdefault.jpg`;
  }
  return (
    project.media.find((item) => item.role === "cover" && item.url && item.kind !== "video" && item.kind !== "embed")?.url ??
    project.media.find((item) => (item.kind === "image" || item.kind === "poster") && item.url)?.url ??
    null
  );
}

export function VideoEmbed({
  media,
  project,
  badge,
  startActive = false,
  onEnded,
}: {
  media: PublicMedia;
  project: PublicProject;
  badge?: string;
  startActive?: boolean;
  onEnded?: () => void;
}) {
  const [active, setActive] = useState(startActive);
  const title = media.caption || media.alt_text || project.title;
  const poster = project.media.find((item) => item.id === media.poster_media_id)?.url ?? null;
  const thumb = videoCover(project, media);

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group relative block aspect-video w-full overflow-hidden bg-card text-left"
      >
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
        ) : null}
        <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
        <span className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground">
          <Play className="size-5 fill-current" aria-hidden />
        </span>
        {badge ? (
          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
            {badge}
          </span>
        ) : null}
        <span className="sr-only">Lire {title}</span>
      </button>
    );
  }

  if (media.provider === "youtube" || media.provider === "vimeo") {
    const src = embedSrc(media);
    if (!src) return null;
    return (
      <iframe
        src={src}
        title={title}
        className="aspect-video w-full bg-black"
        allow="fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (!media.url) return null;

  return (
    <video
      controls
      autoPlay
      poster={poster ?? undefined}
      className="aspect-video w-full bg-black object-contain"
      src={media.url}
      onEnded={onEnded}
    />
  );
}
