import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteProject,
  duplicateProject,
  publishProject,
  saveProjectAction,
  unpublishProject,
} from "@/lib/admin/actions/projects";
import { ActionForm } from "@/components/admin/action-form";
import { Feedback, PageIntro } from "@/components/admin/feedback";
import { MediaManager } from "@/components/admin/media-manager";
import { ProjectFields } from "@/components/admin/project-fields";
import { Steps } from "@/components/admin/steps";
import { Button } from "@/components/ui/button";
import { getAdminProject, listCategories, listProjectMedia, listProjects } from "@/lib/admin/queries";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; erreur?: string; etape?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const step = query.etape === "2" || query.etape === "3" ? query.etape : "1";
  const [result, categories, media, projects] = await Promise.all([
    getAdminProject(id),
    listCategories(),
    listProjectMedia(id),
    listProjects({}),
  ]);

  if (!result.ok && result.reason === "missing") notFound();
  if (!result.ok) {
    return <p className="text-sm text-destructive">La publication n&apos;a pas pu être chargée.</p>;
  }

  const project = result.project;
  const base = `/admin/projets/${project.id}`;
  const returnTo = `${base}?etape=${step}`;

  return (
    <main className="grid gap-8">
      <PageIntro
        eyebrow={
          project.status === "published"
            ? "Publié — Visible sur votre site"
            : "Brouillon — Invisible aux visiteurs"
        }
        title={project.title}
        body="Trois étapes : les informations, les images et les vidéos, puis la publication."
      />
      <Steps current={step} base={base} />
      <Feedback notice={query.notice} error={query.erreur} />

      {step === "1" ? (
        categories === null ? (
          <p className="text-sm text-destructive">Les catégories n&apos;ont pas pu être chargées.</p>
        ) : (
          <ActionForm action={saveProjectAction} className="max-w-3xl">
            <ProjectFields
              project={project}
              categories={categories}
              categoryIds={result.categoryIds}
              links={result.linksAvailable ? result.links : null}
            />
            {!result.linksAvailable ? (
              <p className="text-sm text-muted-foreground">
                Les liens utiles seront éditables après la migration SQL annoncée.
              </p>
            ) : null}
            <Button type="submit" className="h-12 px-6">
              Enregistrer et continuer
            </Button>
          </ActionForm>
        )
      ) : null}

      {step === "2" ? (
        media === null || projects === null ? (
          <p className="text-sm text-destructive">Les images et les vidéos n&apos;ont pas pu être chargées.</p>
        ) : (
          <section className="grid gap-6">
            <MediaManager
              key={media.map((item) => item.id).join()}
              projectId={project.id}
              media={media}
              projects={projects.map((item) => ({ id: item.id, title: item.title }))}
              returnTo={returnTo}
            />
            <Button asChild className="h-12 w-fit px-6">
              <Link href={`${base}?etape=3`}>Continuer vers la vérification</Link>
            </Button>
          </section>
        )
      ) : null}

      {step === "3" ? (
        <section className="grid max-w-3xl gap-6">
          <article className="grid gap-3 border border-border p-5">
            <h2 className="font-display text-3xl">Aperçu</h2>
            <p className="text-sm text-muted-foreground">
              {project.client_name ? `Client : ${project.client_name}. ` : ""}
              {media === null
                ? "Les médias n'ont pas pu être comptés."
                : `${media.length} fichier${media.length > 1 ? "s" : ""} associé${media.length > 1 ? "s" : ""}.`}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href={`${base}/apercu`} className="underline underline-offset-4">
                Prévisualiser la page
              </Link>
              {project.status === "published" ? (
                <Button asChild>
                  <a href={`/portfolio/${project.slug}`} target="_blank" rel="noreferrer">
                    Voir sur mon site
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground">Brouillon — Invisible aux visiteurs</span>
              )}
            </div>
          </article>
          {project.status === "published" ? (
            <form action={unpublishProject}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="returnTo" value={`${base}?etape=3`} />
              <Button type="submit" variant="outline" className="h-12 px-6">
                Enregistrer comme brouillon
              </Button>
            </form>
          ) : (
            <form action={publishProject}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="returnTo" value={`${base}?etape=3`} />
              <Button type="submit" className="h-12 px-6">
                Publier sur le portfolio
              </Button>
            </form>
          )}
          <p className="text-sm text-muted-foreground">
            La publication utilise les informations déjà enregistrées. Reviens à l&apos;étape 1 si tu veux modifier le texte.
          </p>
          <details className="border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm">Autres actions</summary>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={duplicateProject}>
                <input type="hidden" name="id" value={project.id} />
                <Button type="submit" variant="outline">
                  Dupliquer
                </Button>
              </form>
              <form action={deleteProject} className="flex items-center gap-2">
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="returnTo" value={base} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="confirm" value="oui" required />
                  Confirmer la suppression
                </label>
                <Button type="submit" variant="destructive">
                  Supprimer
                </Button>
              </form>
            </div>
          </details>
        </section>
      ) : null}
    </main>
  );
}
