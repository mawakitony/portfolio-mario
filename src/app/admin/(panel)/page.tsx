import { FolderKanban, Images, Mail, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState, StatusBadge } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/admin/queries";

export default async function AdminHomePage() {
  const dashboard = await getDashboard();
  const indicators = [
    ["Publications", dashboard.counts.projects, FolderKanban],
    ["Publiées", dashboard.counts.published, Sparkles],
    ["Brouillons", dashboard.counts.drafts, FolderKanban],
    ["Messages", dashboard.counts.messages, Mail],
  ] as const;

  return (
    <main className="grid gap-10">
      <header className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-[0_18px_50px_-36px_rgba(0,0,0,0.8)] md:p-8">
        <div>
          <p className="text-xs tracking-[0.22em] text-brand uppercase">MARDIGITAL</p>
          <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">Bonjour Mario</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Voici votre espace de création MARDIGITAL.
          </p>
        </div>
        <Button asChild className="h-12 w-full px-5 sm:w-fit">
          <Link href="/admin/publications/nouvelle">
            <Plus className="size-4" />
            + Publier
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicators.map(([label, value, Icon]) => (
          <article key={label} className="rounded-2xl border border-border bg-card px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
              <Icon className="size-4 text-brand" aria-hidden />
            </div>
            <p className="mt-4 font-display text-5xl">{value === null ? "—" : value}</p>
            {value === null ? <p className="mt-2 text-xs text-destructive">Indicateur indisponible</p> : null}
          </article>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink href="/admin/publications/nouvelle" icon={Plus} label="Ajouter une publication" />
        <QuickLink href="/admin/mediatheque" icon={Images} label="Médias" />
        <QuickLink href="/admin/messages" icon={Mail} label="Messages" />
        <QuickLink href="/#images" icon={Sparkles} label="Voir le site" />
      </section>

      <section>
        <h2 className="font-display text-4xl">Mes publications</h2>
        {dashboard.projects === null ? (
          <p className="mt-4 text-sm text-destructive">La liste est indisponible.</p>
        ) : dashboard.projects.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Aucune publication." body="Commence par le bouton + Publier." />
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboard.projects.map((project) => (
              <li key={project.id}>
                <Link href={`/admin/publications/${project.id}`} className="block overflow-hidden rounded-2xl border border-border bg-card hover:border-primary">
                  <span className="flex aspect-[4/3] items-center justify-center bg-muted">
                    {project.coverUrl ? (
                      <Image src={project.coverUrl} alt="" width={640} height={480} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm text-muted-foreground">Sans image</span>
                    )}
                  </span>
                  <span className="grid gap-2 px-4 py-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium">{project.title}</span>
                      <StatusBadge status={project.status} />
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Plus;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon className="size-4 text-brand" aria-hidden />
      {label}
    </Link>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}
