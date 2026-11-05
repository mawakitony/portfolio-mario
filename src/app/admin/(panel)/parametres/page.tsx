import { importCurrentServices, saveServiceAction, saveSettingsAction } from "@/lib/admin/actions/settings";
import { deleteService } from "@/lib/admin/actions/settings";
import { ActionForm } from "@/components/admin/action-form";
import { BrandingControl } from "@/components/admin/branding-control";
import { EmptyState, Feedback, Field, PageIntro, areaClass, controlClass } from "@/components/admin/feedback";
import { SlugFields } from "@/components/admin/slug-fields";
import { Button } from "@/components/ui/button";
import { getSettingsForm, listServices } from "@/lib/admin/queries";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const [settings, services] = await Promise.all([getSettingsForm(), listServices()]);

  return (
    <main className="grid max-w-3xl gap-12">
      <PageIntro
        eyebrow="Site public"
        title="Personnaliser mon site"
        body="Modifie les textes, le logo et le portrait affichés sur le site."
      />
      <Feedback notice={params.notice} error={params.erreur} />
      {!settings.loaded ? (
        <p className="text-sm text-destructive">
          Les réglages distants n&apos;ont pas pu être lus. Le formulaire reprend les textes actuellement prévus pour le site.
        </p>
      ) : null}
      <ActionForm action={saveSettingsAction}>
        <h2 className="font-display text-4xl">Identité de l&apos;agence</h2>
        <Field label="Nom">
          <input name="name" required defaultValue={settings.name} className={controlClass} />
        </Field>
        <Field label="Raison sociale">
          <input name="legalName" required defaultValue={settings.legalName} className={controlClass} />
        </Field>
        <Field label="Signature">
          <input name="signature" required defaultValue={settings.signature} className={controlClass} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Directeur">
            <input name="director" required defaultValue={settings.director} className={controlClass} />
          </Field>
          <Field label="Fonction">
            <input name="role" required defaultValue={settings.role} className={controlClass} />
          </Field>
        </div>
        <h2 className="font-display text-4xl">Présentation</h2>
        <Field label="Promesse">
          <textarea name="promise" required defaultValue={settings.promise} className={areaClass} />
        </Field>
        <Field label="Présentation" hint="Sépare les paragraphes par une ligne vide.">
          <textarea name="about" required defaultValue={settings.about} className={areaClass} />
        </Field>
        <h2 className="font-display text-4xl">Coordonnées</h2>
        <Field label="E-mail">
          <input name="email" type="email" required defaultValue={settings.email} className={controlClass} />
        </Field>
        <Field label="Téléphones" hint="Un numéro par ligne.">
          <textarea name="phones" defaultValue={settings.phones} className={areaClass} />
        </Field>
        <Field label="Localisation">
          <input name="location" required defaultValue={settings.location} className={controlClass} />
        </Field>
        <h2 className="font-display text-4xl">Réseaux sociaux</h2>
        {(["instagram", "facebook", "tiktok", "linkedin", "behance", "youtube"] as const).map((name) => (
          <Field key={name} label={name}>
            <input name={name} defaultValue={settings[name]} placeholder="https://" className={controlClass} />
          </Field>
        ))}
        <h2 className="font-display text-4xl">Référencement avancé</h2>
        <Field label="Titre SEO">
          <input name="seoTitle" maxLength={70} defaultValue={settings.seoTitle} className={controlClass} />
        </Field>
        <Field label="Description SEO">
          <textarea name="seoDescription" maxLength={180} defaultValue={settings.seoDescription} className={areaClass} />
        </Field>
        <Button type="submit">Enregistrer les textes</Button>
      </ActionForm>

      <section className="grid gap-4">
        <h2 className="font-display text-4xl">Logo et portrait</h2>
        <div className="grid gap-4 md:grid-cols-2">
        <BrandingControl kind="logo" label="Logo" url={settings.logoUrl} />
        <BrandingControl kind="portrait" label="Portrait" url={settings.portraitUrl} />
        </div>
      </section>

      <section id="services" className="grid gap-6">
        <h2 className="font-display text-4xl">Services</h2>
        <p className="text-sm text-muted-foreground">
          Dès qu&apos;un service est publié, il remplace la liste statique du site. Laisse-les en brouillon tant que la liste n&apos;est pas complète.
        </p>
        <form action={importCurrentServices}>
          <Button type="submit" variant="outline">
            Importer l&apos;offre actuelle en brouillons
          </Button>
        </form>
        {services === null ? (
          <p className="text-sm text-destructive">Les services n&apos;ont pas pu être chargés.</p>
        ) : services.length === 0 ? (
          <EmptyState title="Aucun service en base." body="Importe l'offre actuelle ou crée une fiche." />
        ) : (
          services.map((service) => (
            <div key={service.id} className="grid gap-4 border-t border-border pt-6">
              <ActionForm action={saveServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <SlugFields titleName="title" defaultTitle={service.title} defaultSlug={service.slug} />
                <Field label="Résumé">
                  <textarea name="summary" defaultValue={service.summary ?? ""} className={areaClass} />
                </Field>
                <Field label="Texte">
                  <textarea name="body" defaultValue={service.body ?? ""} className={areaClass} />
                </Field>
                <Field label="Points" hint="Un point par ligne.">
                  <textarea name="items" defaultValue={service.items.join("\n")} className={areaClass} />
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Ordre">
                    <input name="sortOrder" type="number" min={0} max={9999} defaultValue={service.sortOrder} className={controlClass} />
                  </Field>
                  <Field label="Statut">
                    <select name="status" defaultValue={service.status} className={controlClass}>
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                  </Field>
                </div>
                <Button type="submit" variant="outline">
                  Enregistrer
                </Button>
              </ActionForm>
              <form action={deleteService} className="flex items-center gap-3">
                <input type="hidden" name="id" value={service.id} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" name="confirm" value="oui" required />
                  Confirmer
                </label>
                <Button type="submit" variant="destructive" size="sm">
                  Supprimer
                </Button>
              </form>
            </div>
          ))
        )}
        <ActionForm action={saveServiceAction}>
          <h3 className="font-display text-3xl">Nouveau service</h3>
          <SlugFields />
          <Field label="Résumé">
            <textarea name="summary" className={areaClass} />
          </Field>
          <Field label="Texte">
            <textarea name="body" className={areaClass} />
          </Field>
          <Field label="Points">
            <textarea name="items" className={areaClass} />
          </Field>
          <Field label="Ordre">
            <input name="sortOrder" type="number" min={0} max={9999} defaultValue={services?.length ?? 0} className={controlClass} />
          </Field>
          <Field label="Statut">
            <select name="status" defaultValue="draft" className={controlClass}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </Field>
          <Button type="submit">Créer</Button>
        </ActionForm>
      </section>
    </main>
  );
}
