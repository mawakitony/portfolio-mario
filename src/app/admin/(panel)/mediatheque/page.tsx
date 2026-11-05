import Link from "next/link";
import { Feedback, PageIntro, controlClass } from "@/components/admin/feedback";
import { MediaManager } from "@/components/admin/media-manager";
import { Button } from "@/components/ui/button";
import { listLibrary, listProjects } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; erreur?: string; filtre?: string; type?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filtre ?? "";
  const kind = params.type === "image" || params.type === "video" ? params.type : "";
  const scopedProject = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filter)
    ? filter
    : null;
  const [media, projects] = await Promise.all([listLibrary(filter, kind), listProjects({})]);

  return (
    <main className="grid gap-8">
      <PageIntro
        eyebrow="Fichiers"
        title="Médiathèque"
        body="Images jusqu'à 10 Mo. Vidéos MP4 ou WebM jusqu'à 100 Mo. Les aperçus sont temporaires : ils se renouvellent à chaque visite."
      />
      <Feedback notice={params.notice} error={params.erreur} />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Type de média">
        <TypeTab href={libraryHref("", filter)} active={kind === ""} label="Tous" />
        <TypeTab href={libraryHref("image", filter)} active={kind === "image"} label="Images" />
        <TypeTab href={libraryHref("video", filter)} active={kind === "video"} label="Vidéos" />
      </div>
      <form className="flex flex-wrap items-end gap-3">
        {kind ? <input type="hidden" name="type" value={kind} /> : null}
        <label className="grid gap-2 text-sm">
          Afficher
          <select name="filtre" defaultValue={filter} className={controlClass}>
            <option value="">Tous les médias</option>
            <option value="libres">Non rattachés</option>
            {(projects ?? []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>
      {media === null || projects === null ? (
        <p className="text-sm text-destructive">La médiathèque n&apos;a pas pu être chargée.</p>
      ) : (
        <MediaManager
          key={`${filter}:${kind}:${media.map((item) => item.id).join()}`}
          projectId={scopedProject}
          media={media}
          projects={projects.map((project) => ({ id: project.id, title: project.title }))}
          returnTo={libraryHref(kind, filter)}
        />
      )}
    </main>
  );
}

function libraryHref(kind: string, filter: string) {
  const query = new URLSearchParams();
  if (kind) query.set("type", kind);
  if (filter) query.set("filtre", filter);
  const value = query.toString();
  return value ? `/admin/mediatheque?${value}` : "/admin/mediatheque";
}

function TypeTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm",
        active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}
