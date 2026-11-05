"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid max-w-xl gap-4">
      <h1 className="font-display text-4xl">Cette page n&apos;a pas pu s&apos;afficher.</h1>
      <button type="button" onClick={reset} className="w-fit text-sm underline underline-offset-4">
        Réessayer
      </button>
    </div>
  );
}
