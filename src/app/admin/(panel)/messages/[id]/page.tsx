import Link from "next/link";
import { deleteMessage, markMessage } from "@/lib/admin/actions/messages";
import { Feedback, PageIntro } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/admin/queries";

export default async function MessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const message = await getMessage(id);
  if (!message) return <p className="text-sm text-destructive">Ce message est introuvable.</p>;

  return (
    <main className="grid max-w-3xl gap-6">
      <PageIntro eyebrow={label(message.status)} title={message.subject || message.name} />
      <Feedback notice={query.notice} error={query.erreur} />
      <p className="text-sm text-muted-foreground">
        {message.name} · {message.email}
        {message.phone ? ` · ${message.phone}` : ""} · {formatDate(message.createdAt)}
      </p>
      <article className="whitespace-pre-wrap text-lg leading-relaxed">{message.message}</article>
      <div className="flex flex-wrap items-center gap-2">
        <form action={markMessage}>
          <input type="hidden" name="id" value={message.id} />
          <input type="hidden" name="status" value="read" />
          <input type="hidden" name="returnTo" value={`/admin/messages/${message.id}`} />
          <Button type="submit" variant="outline" size="sm">
            Marquer lu
          </Button>
        </form>
        <form action={markMessage}>
          <input type="hidden" name="id" value={message.id} />
          <input type="hidden" name="status" value="archived" />
          <input type="hidden" name="returnTo" value={`/admin/messages/${message.id}`} />
          <Button type="submit" size="sm">
            Marquer traité
          </Button>
        </form>
        <form action={deleteMessage} className="flex items-center gap-2">
          <input type="hidden" name="id" value={message.id} />
          <input type="hidden" name="returnTo" value={`/admin/messages/${message.id}`} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="confirm" value="oui" required />
            Confirmer
          </label>
          <Button type="submit" variant="destructive" size="sm">
            Supprimer
          </Button>
        </form>
      </div>
      <Link href="/admin/messages" className="text-sm underline underline-offset-4">
        Tous les messages
      </Link>
    </main>
  );
}

function label(status: "new" | "read" | "archived") {
  if (status === "new") return "Nouveau";
  if (status === "read") return "Lu";
  return "Traité";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
