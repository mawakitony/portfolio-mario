import { deleteCategory, reorderCategories, saveCategoryAction } from "@/lib/admin/actions/categories";
import { ActionForm } from "@/components/admin/action-form";
import { EmptyState, Feedback, Field, PageIntro, areaClass, controlClass } from "@/components/admin/feedback";
import { SlugFields } from "@/components/admin/slug-fields";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/lib/admin/queries";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const categories = await listCategories();

  return (
    <main className="grid gap-10">
      <PageIntro
        eyebrow="Classement"
        title="Catégories"
        body="Les catégories restent disponibles pour les anciennes pages. Une catégorie encore utilisée ne peut pas être supprimée."
      />
      <Feedback notice={params.notice} error={params.erreur} />
      {categories === null ? (
        <p className="text-sm text-destructive">Les catégories n&apos;ont pas pu être chargées.</p>
      ) : (
        <>
          <ActionForm action={saveCategoryAction} className="max-w-xl">
            <SlugFields titleName="name" titleLabel="Nom" />
            <Field label="Description">
              <textarea name="description" className={areaClass} />
            </Field>
            <Field label="Ordre">
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={categories.length} className={controlClass} />
            </Field>
            <Button type="submit">Créer</Button>
          </ActionForm>
          {categories.length === 0 ? (
            <EmptyState title="Aucune catégorie." body="Crée la première pour classer d'anciennes publications." />
          ) : (
            <>
              <form action={reorderCategories} className="grid gap-4">
                <input type="hidden" name="ids" value={categories.map((category) => category.id).join(",")} />
                <ul className="grid gap-6">
                  {categories.map((category) => (
                    <li key={category.id} className="grid gap-4 border border-border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-display text-3xl">{category.name}</p>
                        <label className="grid gap-1 text-xs">
                          Ordre
                          <input
                            name={`sort_${category.id}`}
                            type="number"
                            min={0}
                            max={9999}
                            defaultValue={category.sortOrder}
                            className="h-10 w-24 rounded-md border border-input bg-background px-3"
                          />
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.slug}</p>
                    </li>
                  ))}
                </ul>
                <Button type="submit" variant="outline" className="w-fit">
                  Enregistrer l&apos;ordre
                </Button>
              </form>
              <div className="grid gap-8">
                {categories.map((category) => (
                  <div key={category.id} className="grid gap-4 border-t border-border pt-6">
                    <ActionForm action={saveCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <SlugFields titleName="name" titleLabel="Nom" defaultTitle={category.name} defaultSlug={category.slug} />
                      <Field label="Description">
                        <textarea name="description" defaultValue={category.description ?? ""} className={areaClass} />
                      </Field>
                      <Field label="Ordre">
                        <input name="sortOrder" type="number" min={0} max={9999} defaultValue={category.sortOrder} className={controlClass} />
                      </Field>
                      <Button type="submit" variant="outline">
                        Modifier
                      </Button>
                    </ActionForm>
                    <form action={deleteCategory} className="flex flex-wrap items-center gap-3">
                      <input type="hidden" name="id" value={category.id} />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" name="confirm" value="oui" required />
                        Confirmer la suppression
                      </label>
                      <Button type="submit" variant="destructive" size="sm">
                        Supprimer
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
