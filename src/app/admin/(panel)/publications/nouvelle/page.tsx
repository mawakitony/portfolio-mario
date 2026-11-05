import { PageIntro } from "@/components/admin/feedback";
import { PublishForm } from "@/components/admin/publish-form";

export default function NewPublicationPage() {
  return (
    <main className="grid gap-8">
      <PageIntro
        eyebrow="Nouvelle publication"
        title="Publier"
        body="Choisis une image, une affiche ou une vidéo, ajoute un titre, puis publie."
      />
      <PublishForm />
    </main>
  );
}
