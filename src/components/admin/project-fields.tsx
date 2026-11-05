import { Field, areaClass, controlClass } from "@/components/admin/feedback";
import { SlugFields } from "@/components/admin/slug-fields";
import type { AdminCategory, ExternalLink } from "@/lib/admin/types";

type ProjectValues = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  client_name: string | null;
  year: number | null;
  tools: string[] | null;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

export function ProjectFields({
  project,
  categories,
  categoryIds = [],
  links,
}: {
  project?: ProjectValues;
  categories: AdminCategory[];
  categoryIds?: string[];
  links?: ExternalLink[] | null;
}) {
  const linkRows = links ? [...links, { label: "", url: "" }] : [];

  return (
    <>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <input type="hidden" name="status" value={project?.status ?? "draft"} />
      <input type="hidden" name="next" value="2" />
      <SlugFields
        defaultTitle={project?.title}
        defaultSlug={project?.slug}
        titleLabel="Titre"
        titleHint="Exemple : Identité visuelle du musée."
        slugLabel="Adresse de la page"
        slugHint="Elle se remplit à partir du nom. Tu peux la modifier."
      />
      <Field label="Description courte" hint="Une ou deux phrases, visibles dans la liste du portfolio.">
        <textarea name="excerpt" maxLength={300} defaultValue={project?.excerpt ?? ""} className={areaClass} />
      </Field>
      <Field label="Description" hint="Le texte de la page. Tu peux raconter le contexte, la demande et le résultat.">
        <textarea name="description" defaultValue={project?.description ?? ""} className={areaClass} />
      </Field>
      <Field label="Client" hint="Facultatif. Exemple : Musée des civilisations.">
        <input name="clientName" defaultValue={project?.client_name ?? ""} className={controlClass} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm">Catégories</legend>
        <p className="text-xs text-muted-foreground">Coche tout ce qui correspond. Tu peux en choisir plusieurs.</p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune catégorie pour le moment. Tu pourras en créer dans la section Catégories, puis revenir ici.
          </p>
        ) : (
          categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={categoryIds.includes(category.id)}
              />
              {category.name}
            </label>
          ))
        )}
      </fieldset>
      <details className="border border-border px-4 py-3">
        <summary className="cursor-pointer text-sm">Options avancées</summary>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Année" hint="Facultatif. Exemple : 2026.">
              <input name="year" inputMode="numeric" defaultValue={project?.year ?? ""} className={controlClass} />
            </Field>
            <Field label="Ordre dans la liste" hint="0 affiche la publication en premier.">
              <input
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={project?.sort_order ?? 0}
                className={controlClass}
              />
            </Field>
          </div>
          <Field label="Outils" hint="Facultatif. Sépare-les par des virgules. Exemple : Photoshop, Figma.">
            <input name="tools" defaultValue={(project?.tools ?? []).join(", ")} className={controlClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={project?.is_featured ?? false} />
            Mettre en avant sur la page d&apos;accueil
          </label>
          <Field label="Titre pour les moteurs de recherche" hint="Facultatif. 70 caractères maximum.">
            <input name="seoTitle" maxLength={70} defaultValue={project?.seo_title ?? ""} className={controlClass} />
          </Field>
          <Field label="Description pour les moteurs de recherche" hint="Facultatif. 180 caractères maximum.">
            <textarea
              name="seoDescription"
              maxLength={180}
              defaultValue={project?.seo_description ?? ""}
              className={areaClass}
            />
          </Field>
          {links ? (
            <fieldset className="grid gap-3">
              <legend className="text-sm">Liens utiles</legend>
              <p className="text-xs text-muted-foreground">Facultatif. Un site, un article ou un dossier.</p>
              {linkRows.map((link, index) => (
                <div key={`${link.url}-${index}`} className="grid gap-3 md:grid-cols-2">
                  <input name="linkLabel" defaultValue={link.label} placeholder="Nom du lien" className={controlClass} />
                  <input name="linkUrl" defaultValue={link.url} placeholder="https://" className={controlClass} />
                </div>
              ))}
            </fieldset>
          ) : null}
        </div>
      </details>
    </>
  );
}
