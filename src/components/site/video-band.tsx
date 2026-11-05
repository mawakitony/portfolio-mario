"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { LikeButton } from "@/components/site/like-button";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { VideoEmbed, videoCover } from "@/components/site/video-embed";
import { getLikeStates } from "@/lib/likes/actions";
import type { PublicMedia, PublicProject } from "@/lib/portfolio/queries";

type Entry = { project: PublicProject; media: PublicMedia };

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 56 : -56, scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -56 : 56, scale: 0.96 }),
};

export function VideoBand({
  entries,
  unavailable,
}: {
  entries: Entry[];
  unavailable: boolean;
}) {
  const reduce = useReducedMotion();
  const [likes, setLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const ids = [...new Set(entries.map((entry) => entry.project.id))].join();
  const count = entries.length;
  const activeIndex = count === 0 ? 0 : ((index % count) + count) % count;

  useEffect(() => {
    const projectIds = ids.length > 0 ? ids.split(",") : [];
    if (projectIds.length === 0) return;
    let cancelled = false;
    getLikeStates(projectIds).then((result) => {
      if (!cancelled && result.ok) setLikes(result.states);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  useEffect(() => {
    if (reduce || count < 2 || playingId) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setIndex((value) => value + 1);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [reduce, count, playingId]);

  if (unavailable) {
    return <Empty title="Les vidéos sont indisponibles." body="Réessaie dans un instant." />;
  }
  if (count === 0) {
    return (
      <Empty
        title="Aucune vidéo publiée."
        body="Les vidéos MP4, WebM, YouTube et Vimeo d'une publication en ligne s'afficheront ici."
      />
    );
  }

  const current = entries[activeIndex];
  const previous = entries[(activeIndex - 1 + count) % count];
  const following = entries[(activeIndex + 1) % count];
  const state = likes[current.project.id];
  const motionDuration = reduce ? 0 : 0.55;

  function go(step: number) {
    setDirection(step);
    setPlayingId(null);
    setIndex((value) => value + step);
  }

  return (
    <div role="region" aria-roledescription="carrousel" aria-label="Vidéos publiées">
      <p className="sr-only" aria-live="polite">
        {activeIndex + 1} sur {count} : {current.project.title}
      </p>
      <div className={count > 1 ? "grid items-center gap-4 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.45fr)_minmax(0,0.72fr)] md:gap-6" : "mx-auto max-w-4xl"}>
        {count > 1 ? <SideCard entry={previous} direction="previous" onSelect={() => go(-1)} /> : null}
        <div className="relative min-w-0">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.article
              key={current.media.id}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: motionDuration, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[1.75rem] border border-[#2078CF]/45 bg-[#011F65] p-3 shadow-[0_0_42px_rgba(32,120,207,0.28)] md:p-4"
            >
              <div className="overflow-hidden rounded-2xl">
                {playingId === current.media.id ? (
                  <VideoEmbed
                    media={current.media}
                    project={current.project}
                    badge={current.project.title}
                    startActive
                    onEnded={() => setPlayingId(null)}
                  />
                ) : (
                  <CoverStage entry={current} onPlay={() => setPlayingId(current.media.id)} />
                )}
              </div>
              {current.project.excerpt || current.media.caption ? (
                <p key={`${current.media.id}-copy`} className="video-fade px-4 py-4 text-center text-sm text-foreground/85">
                  {current.project.excerpt || current.media.caption}
                </p>
              ) : null}
            </motion.article>
          </AnimatePresence>
          <div key={current.media.id} className="video-fade mt-6 flex flex-wrap items-center justify-center gap-3">
            <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm">
              <span className="font-semibold">{current.project.title}</span>
              {current.project.year ? <span className="font-semibold text-brand">{current.project.year}</span> : null}
              {current.project.clientName ? <span className="text-muted-foreground">{current.project.clientName}</span> : null}
            </p>
            <LikeButton projectId={current.project.id} count={state?.count ?? current.project.likeCount} liked={state?.liked ?? false} />
          </div>
          {count > 1 ? (
            <div className="mt-5 flex justify-center gap-3 md:hidden">
              <ArrowButton label="Vidéo précédente" onClick={() => go(-1)}>
                <ChevronLeft className="size-4" aria-hidden />
              </ArrowButton>
              <ArrowButton label="Vidéo suivante" onClick={() => go(1)}>
                <ChevronRight className="size-4" aria-hidden />
              </ArrowButton>
            </div>
          ) : null}
        </div>
        {count > 1 ? <SideCard entry={following} direction="next" onSelect={() => go(1)} /> : null}
      </div>
    </div>
  );
}

function CoverStage({ entry, onPlay }: { entry: Entry; onPlay: () => void }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <CoverVisual entry={entry} featured />
      <button type="button" onClick={onPlay} className="absolute inset-0">
        <span className="sr-only">Lire {entry.project.title}</span>
      </button>
    </div>
  );
}

function SideCard({
  entry,
  direction,
  onSelect,
}: {
  entry: Entry;
  direction: "previous" | "next";
  onSelect: () => void;
}) {
  const label = direction === "previous" ? "Vidéo précédente" : "Vidéo suivante";

  return (
    <MotionReveal variant="staggerScale" delay={direction === "previous" ? 0.1 : 0.2} className="group relative hidden overflow-hidden rounded-2xl border border-white/10 bg-black text-left opacity-90 md:block">
      <CoverVisual entry={entry} />
      <button type="button" onClick={onSelect} aria-label={`${label} : ${entry.project.title}`} className="absolute inset-0">
        <span className="sr-only">{label}</span>
      </button>
      <span
        className={`pointer-events-none absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/70 text-white transition-transform duration-300 motion-safe:group-hover:scale-110 ${direction === "previous" ? "right-3" : "left-3"}`}
      >
        {direction === "previous" ? <ChevronLeft className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
      </span>
    </MotionReveal>
  );
}

function CoverVisual({ entry, featured = false }: { entry: Entry; featured?: boolean }) {
  const image = videoCover(entry.project, entry.media);
  const file = entry.media.provider === "storage" && entry.media.url ? entry.media.url : null;

  return (
    <span className="relative block aspect-video overflow-hidden">
      {image ? (
        <MotionReveal variant="zoomOut" className="absolute inset-0">
          <Image src={image} alt="" fill sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "240px"} className="object-cover" />
        </MotionReveal>
      ) : file ? (
        <MotionReveal variant="zoomOut" className="absolute inset-0">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={file}
          muted
          playsInline
          preload="metadata"
          onLoadedData={(event) => {
            const node = event.currentTarget;
            if (!Number.isFinite(node.duration) || node.duration <= 0 || node.currentTime > 0) return;
            node.currentTime = Math.min(0.35, node.duration / 2);
          }}
        />
        </MotionReveal>
      ) : (
        <span className="absolute inset-0 bg-card" />
      )}
      <span
        className={`pointer-events-none absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white ${featured ? "size-12" : "size-8"}`}
      >
        <Play className={featured ? "size-5 fill-current" : "size-3 fill-current"} aria-hidden />
      </span>
      <span className="pointer-events-none absolute bottom-3 left-3 max-w-[68%] truncate rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
        {entry.project.title}
      </span>
    </span>
  );
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full border border-[#2078CF]/40 bg-black/75 text-white transition-transform duration-200 motion-safe:hover:scale-110 motion-safe:active:scale-95"
    >
      {children}
    </button>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-xl border border-dashed border-white/15 px-6 py-16 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
