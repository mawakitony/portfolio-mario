import type { ActionState } from "@/lib/admin/types";

const notices: Record<string, string> = {
  cree: "La publication est créée.",
  enregistre: "Les informations sont enregistrées.",
  publie: "Publié — Visible sur votre site.",
  depublie: "La publication est revenue en brouillon. Elle est invisible sur le site.",
  supprime: "L'élément a été supprimé.",
  copie: "La copie est enregistrée en brouillon.",
  liens: "Le projet est enregistré. Les liens externes attendent la migration SQL.",
  categorie: "La catégorie est créée.",
  supprimee: "La catégorie est supprimée.",
  ordre: "L'ordre des catégories est enregistré.",
  media: "Le média est mis à jour.",
  "media-supprime": "Le média est supprimé.",
  couverture: "L'image principale est définie.",
  miniature: "La miniature est enregistrée.",
  rattache: "Le média est associé au projet.",
  detache: "Le média n'est plus associé à un projet.",
  embed: "La vidéo est ajoutée.",
  traite: "Le message est marqué comme traité.",
  lu: "Le message est marqué comme lu.",
  image: "L'image du site est retirée.",
  service: "Le service est créé.",
  "service-supprime": "Le service est supprimé.",
  "services-importes": "L'offre actuelle est importée en brouillons.",
};

const errors: Record<string, string> = {
  introuvable: "L'élément demandé est introuvable.",
  publication: "La publication a échoué.",
  depublication: "Le retrait de la publication a échoué.",
  medias: "La publication est en ligne, mais certains fichiers ne sont pas encore visibles.",
  suppression: "La suppression a échoué.",
  confirmation: "Coche la confirmation avant de supprimer.",
  duplication: "La copie n'a pas pu être créée.",
  utilisee: "Cette catégorie est encore utilisée. Retire-la avant de la supprimer.",
  media: "L'opération sur le média a échoué.",
  embed: "Le lien doit être une adresse YouTube ou Vimeo en https.",
  message: "Le message n'a pas pu être mis à jour.",
  image: "L'image du site n'a pas pu être modifiée.",
  service: "Le service n'a pas pu être enregistré.",
  "services-existants": "Des services existent déjà. L'import est annulé pour ne pas les écraser.",
};

export function Feedback({
  notice,
  error,
}: {
  notice?: string | string[];
  error?: string | string[];
}) {
  const noticeCode = Array.isArray(notice) ? notice[0] : notice;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const message = (noticeCode && notices[noticeCode]) || (errorCode && errors[errorCode]);
  if (!message) return null;
  const ok = Boolean(noticeCode && notices[noticeCode]);
  return (
    <p role="status" className={ok ? "text-sm text-brand" : "text-sm text-destructive"}>
      {message}
    </p>
  );
}

export function Notice({ state }: { state: ActionState | null }) {
  if (!state) return null;
  return (
    <p role="status" className={state.ok ? "text-sm text-brand" : "text-sm text-destructive"}>
      {state.message}
    </p>
  );
}

export function PageIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">{title}</h1>
      {body ? <p className="mt-4 text-sm text-muted-foreground">{body}</p> : null}
    </header>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" | "new" | "read" | "archived" }) {
  const published = status === "published";
  const fresh = status === "new";
  const label =
    status === "published"
      ? "Publié — Visible sur votre site"
      : status === "draft"
        ? "Brouillon — Invisible aux visiteurs"
        : status === "new"
          ? "Nouveau"
          : status === "read"
            ? "Lu"
            : "Traité";
  return (
    <span
      className={
        published || fresh
          ? "inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs text-brand"
          : "inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
      }
    >
      {label}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border px-6 py-12">
      <p className="font-display text-3xl">{title}</p>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export const controlClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export const areaClass =
  "min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
