"use client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-7xl flex-col justify-end px-6 py-20 md:px-10">
      <h1 className="font-display text-6xl tracking-tight">La page n&apos;a pas pu s&apos;afficher.</h1>
      <button type="button" onClick={reset} className="mt-8 text-left text-sm underline underline-offset-4">
        Réessayer
      </button>
    </main>
  );
}
