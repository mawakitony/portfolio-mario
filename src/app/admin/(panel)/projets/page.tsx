import { Eye, LayoutGrid, List, Pencil, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteProject, duplicateProject, publishProject, unpublishProject } from "@/lib/admin/actions/projects";
import { EmptyState, Feedback, PageIntro, StatusBadge, controlClass } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";
import { listCategories, listProjects } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    erreur?: string;
    statut?: string;
    q?: string;
    categorie?: string;
    tri?: string;
    vue?: string;
  }>;
}) {
  const params = await searchParams;
  const view = params.vue === "liste" ? "liste" : "grille";
  const [projects, categories] = await Promise.all([
    listProjects({ status: params.statut, query: params.q, category: params.categorie, sort: params.tri }),
    listCategories(),
  ]);
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.statut) query.set("statut", params.statut);
  if (params.categorie) query.set("categorie", params.categorie);
  if (params.tri) query.set("tri", params.tri);

  return (
    <main className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Portfolio"
          title="Mes publications"
          body="Retrouve tes brouillons et ce qui est déjà visible sur le site."
        />
        <Button asChild className="h-12 px-5">
          <Link href="/admin/projets/nouveau">
            <Plus className="size-4" />
            Ajouter une publication
          </Link>
        </Button>
      </div>
      <Feedback notice={params.notice} error={params.erreur} />
      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_10rem_12rem_10rem_auto] md:items-end">
        <label className="grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <Search className="size-4" aria-hidden />
            Recherche
          </span>
          <input name="q" defaultValue={params.q ?? ""} placeholder="Titre" className={controlClass} />
        </label>
        <label className="grid gap-2 text-sm">
          Statut
          <select name="statut" defaultValue={params.statut ?? ""} className={controlClass}>
            <option value="">Tous</option>
            <option value="draft">Brouillons</option>
            <option value="published">Publiées</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Catégorie
          <select name="categorie" defaultValue={params.categorie ?? ""} className={controlClass}>
            <option value="">Toutes</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Tri
          <select name="tri" defaultValue={params.tri ?? ""} className={controlClass}>
            <option value="">Ordre du portfolio</option>
            <option value="recent">Plus récentes</option>
            <option value="ancien">Plus anciennes</option>
          </select>
        </label>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>
      <div className="flex gap-2">
        <ViewLink href={viewHref(query, "grille")} active={view === "grille"} label="Grille" icon={LayoutGrid} />
        <ViewLink href={viewHref(query, "liste")} active={view === "liste"} label="Liste" icon={List} />
      </div>
      {projects === null ? (
        <p className="text-sm text-destructive">Les publications n&apos;ont pas pu être chargées.</p>
      ) : projects.length === 0 ? (
        <EmptyState title="Aucune publication." body="Publie une image ou une vidéo, ou élargis les filtres." />
      ) : (
        <ul className={view === "grille" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>
          {projects.map((project) => (
            <li key={project.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className={view === "liste" ? "grid md:grid-cols-[12rem_1fr]" : ""}>
                <div className="flex aspect-[4/3] items-center justify-center bg-muted md:aspect-auto md:min-h-36">
                  {project.coverUrl ? (
                    <Image src={project.coverUrl} alt="" width={640} height={480} className="h-full w-full object-cover" />
                  ) : (
                    <p className="px-4 text-center text-sm text-muted-foreground">Sans image</p>
                  )}
                </div>
                <div className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-3xl leading-none">{project.title}</h2>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.categories.length > 0 ? project.categories.join(", ") : "Sans catégorie"}
                    {" · "}
                    {formatDate(project.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/publications/${project.id}`}>
                        <Pencil className="size-3.5" />
                        Modifier
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/projets/${project.id}/apercu`}>
                        <Eye className="size-3.5" />
                        Prévisualiser
                      </Link>
                    </Button>
                    {project.status === "published" ? (
                      <Button asChild size="sm">
                        <a href={`/portfolio/${project.slug}`} target="_blank" rel="noreferrer">
                          Voir sur mon site
                        </a>
                      </Button>
                    ) : null}
                    {project.status === "published" ? (
                      <form action={unpublishProject}>
                        <input type="hidden" name="id" value={project.id} />
                        <input type="hidden" name="returnTo" value="/admin/projets" />
                        <Button type="submit" variant="outline" size="sm">
                          Retirer
                        </Button>
                      </form>
                    ) : (
                      <form action={publishProject}>
                        <input type="hidden" name="id" value={project.id} />
                        <input type="hidden" name="returnTo" value="/admin/projets" />
                        <Button type="submit" size="sm">
                          Publier
                        </Button>
                      </form>
                    )}
                    <form action={duplicateProject}>
                      <input type="hidden" name="id" value={project.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Dupliquer
                      </Button>
                    </form>
                    <form action={deleteProject} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={project.id} />
                      <input type="hidden" name="returnTo" value="/admin/projets" />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" name="confirm" value="oui" required />
                        Confirmer
                      </label>
                      <Button type="submit" variant="destructive" size="sm">
                        Supprimer
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function viewHref(query: URLSearchParams, view: "grille" | "liste") {
  const next = new URLSearchParams(query);
  next.set("vue", view);
  return `/admin/projets?${next.toString()}`;
}

function ViewLink({
  href,
  active,
  label,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: typeof List;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        active ? "border-primary text-foreground" : "border-border text-muted-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}
