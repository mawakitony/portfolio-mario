import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-7xl flex-col justify-end px-6 py-20 md:px-10">
      <p className="text-xs tracking-[0.22em] text-brand uppercase">404</p>
      <h1 className="mt-4 font-display text-6xl tracking-tight md:text-8xl">Page introuvable</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Cette adresse ne correspond à aucune page publiée.
      </p>
      <Link href="/" className="mt-8 text-sm underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
