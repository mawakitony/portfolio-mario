"use client";

import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LikeButton } from "@/components/site/like-button";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";
import { getLikeStates } from "@/lib/likes/actions";
import type { ImageCard } from "@/lib/portfolio/image-cards";

const previewCount = 6;
const spans = [
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-4",
  "md:col-span-5",
  "md:col-span-3",
];

export type { ImageCard };

export function ImageBoard({
  cards,
  unavailable,
  preview = false,
}: {
  cards: ImageCard[];
  unavailable: boolean;
  preview?: boolean;
}) {
  const [likes, setLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const visible = preview ? cards.slice(0, previewCount) : cards;
  const open = openIndex === null ? null : visible[openIndex] ?? null;
  const ids = cards.map((card) => card.id).join();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") setOpenIndex((index) => (index === null ? index : Math.min(visible.length - 1, index + 1)));
      if (event.key === "ArrowLeft") setOpenIndex((index) => (index === null ? index : Math.max(0, index - 1)));
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, visible.length]);

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

  if (unavailable) {
    return <Empty title="Les images sont indisponibles." body="Réessaie dans un instant." />;
  }
  if (cards.length === 0) {
    return (
      <Empty
        title="Aucune image publiée."
        body="Les images, affiches et cartes de visite publiées depuis l'administration apparaîtront ici."
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {visible.map((card, index) => {
          const state = likes[card.id];
          return (
            <RevealOnScroll
              key={card.id}
              variant="staggerScale"
              className={`h-full ${spans[index % spans.length]}`}
              delay={(index % 4) * 100}
            >
            <article className="group relative h-[280px] overflow-hidden rounded-[1.35rem] border border-[#2078CF]/30 bg-[#011F65] md:h-[340px]">
              <button
                type="button"
                onClick={() => {
                  if (card.src) setOpenIndex(index);
                }}
                className="absolute inset-0 text-left"
              >
                {card.src ? (
                  <MotionReveal variant="zoomOut" delay={(index % 4) * 0.08} className="absolute inset-0">
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      sizes="(min-width: 768px) 40vw, 100vw"
                      className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-[1.04]"
                    />
                  </MotionReveal>
                ) : (
                  <span className="absolute inset-0 bg-card" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                <span className="absolute top-4 left-4 text-xs font-medium text-white/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="absolute inset-x-0 bottom-0 p-5">
                  <span className="block text-lg font-semibold text-white">{card.title}</span>
                  {card.excerpt ? (
                    <span className="mt-1 line-clamp-2 block text-sm text-white/65">{card.excerpt}</span>
                  ) : null}
                </span>
                <span className="sr-only">{card.src ? `Agrandir ${card.title}` : card.title}</span>
              </button>
              <div className="absolute top-3 right-3 z-10">
                <LikeButton
                  projectId={card.id}
                  count={state?.count ?? card.likeCount}
                  liked={state?.liked ?? false}
                  overlay
                />
              </div>
            </article>
            </RevealOnScroll>
          );
        })}
      </div>
      {preview ? (
        <div className="mt-10 flex justify-center">
          <Link
            href="/galerie"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 motion-safe:hover:scale-[1.03]"
          >
            Voir plus
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}
      {open?.src && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 md:p-8"
              onClick={() => setOpenIndex(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={open.title}
                className="relative flex max-h-full max-w-full flex-col items-center"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  className="fixed top-4 right-4 grid size-10 place-items-center rounded-full border border-white/20 bg-black/70 text-white"
                >
                  <X className="size-4" aria-hidden />
                  <span className="sr-only">Fermer</span>
                </button>
                {openIndex !== null && openIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex - 1)}
                    className="fixed top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    <span className="sr-only">Image précédente</span>
                  </button>
                ) : null}
                {openIndex !== null && openIndex < visible.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex + 1)}
                    className="fixed top-1/2 right-16 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                    <span className="sr-only">Image suivante</span>
                  </button>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element -- the file's own pixels set the popup ratio */}
                <img src={open.src} alt={open.alt} className="max-h-[78vh] max-w-[92vw] object-contain" />
                <div className="mt-4 flex w-full max-w-3xl flex-wrap items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-lg font-semibold">{open.title}</p>
                    {open.excerpt ? <p className="mt-1 max-w-xl text-sm text-white/70">{open.excerpt}</p> : null}
                    <Link href={`/portfolio/${open.slug}`} className="nav-link mt-2 inline-block text-sm font-medium text-white/80">
                      Voir la publication
                    </Link>
                  </div>
                  <LikeButton
                    projectId={open.id}
                    count={likes[open.id]?.count ?? open.likeCount}
                    liked={likes[open.id]?.liked ?? false}
                    overlay
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
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
