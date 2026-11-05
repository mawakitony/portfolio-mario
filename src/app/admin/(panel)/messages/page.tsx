import Link from "next/link";
import { deleteMessage, markMessage } from "@/lib/admin/actions/messages";
import { EmptyState, Feedback, PageIntro, StatusBadge, controlClass } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";
import { listMessages } from "@/lib/admin/queries";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; erreur?: string; statut?: string; q?: string }>;
}) {
  const params = await searchParams;
  const messages = await listMessages({ status: params.statut, query: params.q });

  return (
    <main className="grid gap-8">
      <PageIntro eyebrow="Contact" title="Messages" body="Les messages envoyés depuis le formulaire du site." />
      <Feedback notice={params.notice} error={params.erreur} />
      <form className="grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end">
        <label className="grid gap-2 text-sm">
          Recherche
          <input name="q" defaultValue={params.q ?? ""} className={controlClass} />
        </label>
        <label className="grid gap-2 text-sm">
          Statut
          <select name="statut" defaultValue={params.statut ?? ""} className={controlClass}>
            <option value="">Tous</option>
            <option value="new">Nouveaux</option>
            <option value="read">Lus</option>
            <option value="archived">Traités</option>
          </select>
        </label>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>
      {messages === null ? (
        <p className="text-sm text-destructive">Les messages n&apos;ont pas pu être chargés.</p>
      ) : messages.length === 0 ? (
        <EmptyState title="Aucun message." body="La boîte est vide pour ce filtre." />
      ) : (
        <ul className="grid gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.status === "new"
                  ? "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-4"
                  : "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-4"
              }
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/admin/messages/${message.id}`} className="font-display text-3xl hover:text-brand">
                    {message.name}
                  </Link>
                  <StatusBadge status={message.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {message.subject || "Sans sujet"} · {message.email} · {formatDate(message.createdAt)}
                </p>
              </div>
              <MessageActions id={message.id} returnTo="/admin/messages" />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function MessageActions({ id, returnTo }: { id: string; returnTo: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={markMessage}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="read" />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button type="submit" variant="outline" size="sm">
          Marquer lu
        </Button>
      </form>
      <form action={markMessage}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="archived" />
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button type="submit" size="sm">
          Marquer traité
        </Button>
      </form>
      <form action={deleteMessage} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" name="confirm" value="oui" required />
          Confirmer
        </label>
        <Button type="submit" variant="destructive" size="sm">
          Supprimer
        </Button>
      </form>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
