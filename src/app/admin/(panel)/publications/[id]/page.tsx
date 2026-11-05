import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, publishProject, unpublishProject } from "@/lib/admin/actions/projects";
import { updatePublicationDetails } from "@/lib/admin/actions/publications";
import { ActionForm } from "@/components/admin/action-form";
import { PageIntro, StatusBadge } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";
import { getAdminProject } from "@/lib/admin/queries";

export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getAdminProject(id);
  if (!result.ok && result.reason === "missing") notFound();
  if (!result.ok) return <p className="text-sm text-destructive">La publication n&apos;a pas pu être chargée.</p>;
  const project = result.project;

  return (
    <main className="grid max-w-3xl gap-8">
      <PageIntro eyebrow="Publication" title={project.title} />
      <StatusBadge status={project.status} />
      <ActionForm action={updatePublicationDetails} className="grid gap-4">
        <input type="hidden" name="id" value={project.id} />
        <label className="grid gap-2 text-sm font-medium">
          Titre
          <input
            name="title"
            required
            defaultValue={project.title}
            maxLength={160}
            className="rounded-lg border border-input bg-transparent px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Courte description
          <textarea
            name="description"
            defaultValue={project.excerpt ?? ""}
            maxLength={300}
            rows={4}
            className="rounded-lg border border-input bg-transparent px-3 py-3 font-normal"
          />
        </label>
        <Button type="submit" className="h-12 w-fit px-6">
          Enregistrer
        </Button>
      </ActionForm>
      <div className="flex flex-wrap gap-3">
        {project.status === "published" ? (
          <>
            <Button asChild>
              <a href={`/portfolio/${project.slug}`} target="_blank" rel="noreferrer">
                Voir sur mon site
              </a>
            </Button>
            <form action={unpublishProject}>
              <input type="hidden" name="id" value={project.id} />
              <input type="hidden" name="returnTo" value={`/admin/publications/${project.id}`} />
              <Button type="submit" variant="outline" className="h-12 px-6">
                Retirer du site
              </Button>
            </form>
          </>
        ) : (
          <form action={publishProject}>
            <input type="hidden" name="id" value={project.id} />
            <input type="hidden" name="returnTo" value={`/admin/publications/${project.id}`} />
            <Button type="submit" className="h-12 px-6">
              Publier
            </Button>
          </form>
        )}
        <Button asChild variant="outline">
          <Link href="/admin/projets">Retour à la liste</Link>
        </Button>
      </div>
      <form action={deleteProject} className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <input type="hidden" name="id" value={project.id} />
        <input type="hidden" name="returnTo" value="/admin/projets" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" value="oui" required />
          Confirmer la suppression
        </label>
        <Button type="submit" variant="destructive">
          Supprimer
        </Button>
      </form>
    </main>
  );
}
