import type { Metadata } from "next";
import { Suspense } from "react";
import { ImageBoard } from "@/components/site/image-board";
import { imageCardsFrom } from "@/lib/portfolio/image-cards";
import { getPublishedProjects } from "@/lib/portfolio/queries";

export const metadata: Metadata = {
  title: "Images / Affiches",
  description: "Images, affiches, cartes de visite et autres créations publiées.",
};

export default function GalleryPage() {
  return (
    <Suspense fallback={<p className="px-6 py-24 text-sm text-muted-foreground">Chargement…</p>}>
      <GalleryContent />
    </Suspense>
  );
}

async function GalleryContent() {
  const result = await getPublishedProjects();
  const cards = result.ok ? imageCardsFrom(result.data) : [];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-5xl md:text-6xl">Images / Affiches</h1>
        <p className="mt-4 text-muted-foreground">Images, affiches, cartes de visite et autres créations publiées.</p>
      </div>
      <div className="mt-12">
        <ImageBoard cards={cards} unavailable={!result.ok} />
      </div>
    </main>
  );
}
