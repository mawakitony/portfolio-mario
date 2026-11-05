"use client";

import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  discardEmptyPublication,
  finalizePublication,
  preparePublication,
} from "@/lib/admin/actions/publications";
import { registerUploadedMedia } from "@/lib/admin/actions/media";
import { resolveMediaFile } from "@/lib/admin/media-rules";
import { uploadToStorage } from "@/lib/admin/upload-client";

export function PublishForm() {
  const router = useRouter();
  const [type, setType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function chooseFile(next: File | null) {
    setError(null);
    if (next) {
      const resolved = resolveMediaFile(next);
      if (!resolved.ok) {
        setError(resolved.message);
        return;
      }
      setType(resolved.media.kind === "video" ? "video" : "image");
    }
    setFile(next);
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  async function submit(intent: "publish" | "draft") {
    if (busy) return;
    setError(null);
    setMessage(null);
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (type === "image" && !file) {
      setError("Choisis une image ou une affiche.");
      return;
    }
    if (type === "video" && !file) {
      setError("Choisis une vidéo MP4 ou WebM.");
      return;
    }

    setBusy(true);
    const prepared = await preparePublication({ title, description });
    if (!prepared.ok) {
      setBusy(false);
      setError(prepared.message);
      return;
    }

    if (file) {
      const resolved = resolveMediaFile(file);
      if (!resolved.ok || (type === "image" && (resolved.media.kind !== "image" || resolved.media.extension === "avif"))) {
        await discardEmptyPublication(prepared.id);
        setBusy(false);
        setError(
          resolved.ok
            ? "Utilise une image JPG, PNG ou WebP. Rien n'a été publié."
            : `${resolved.message} Rien n'a été publié.`,
        );
        return;
      }
      if (type === "video" && resolved.media.kind !== "video") {
        await discardEmptyPublication(prepared.id);
        setBusy(false);
        setError("Utilise une vidéo MP4 ou WebM. Rien n'a été publié.");
        return;
      }
      try {
        setProgress(0);
        const path = `projects/${crypto.randomUUID()}.${resolved.media.extension}`;
        const uploaded = await uploadToStorage({
          bucket: resolved.media.bucket,
          path,
          file,
          mime: resolved.media.mime,
          onProgress: setProgress,
        });
        const registered = await registerUploadedMedia({
          projectId: prepared.id,
          bucket: resolved.media.bucket,
          path: uploaded,
          mime: resolved.media.mime,
        });
        if (!registered.ok) {
          await discardEmptyPublication(prepared.id);
          setBusy(false);
          setProgress(null);
          setError(`${registered.message ?? "Le fichier n'a pas été enregistré."} Rien n'a été publié.`);
          return;
        }
      } catch (caught) {
        await discardEmptyPublication(prepared.id);
        setBusy(false);
        setProgress(null);
        setError(`${caught instanceof Error ? caught.message : "L'envoi a échoué."} Rien n'a été publié.`);
        return;
      }
    }

    const done = await finalizePublication({ id: prepared.id, intent });
    setBusy(false);
    setProgress(null);
    if (!done.ok) {
      setError(done.message);
      return;
    }
    setMessage(done.message);
    router.push(intent === "publish" ? `/#${type === "image" ? "images" : "videos"}` : "/admin/projets");
    router.refresh();
  }

  const fileIsVideo = Boolean(file && /\.(mp4|webm)$/i.test(file.name));

  return (
    <form
      className="grid max-w-3xl gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit("publish");
      }}
    >
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Type</legend>
        <div className="flex flex-wrap gap-3">
          <TypeButton current={type === "image"} onClick={() => setType("image")}>
            Image / Affiche
          </TypeButton>
          <TypeButton current={type === "video"} onClick={() => setType("video")}>
            Vidéo
          </TypeButton>
        </div>
      </fieldset>

      <div className="grid gap-3">
        <div
          className="grid gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-8"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <UploadCloud className="size-6 text-brand" aria-hidden />
          <p className="text-sm font-medium">Importer une image ou une vidéo</p>
          <p className="text-sm text-muted-foreground">JPG, PNG, WebP, MP4 ou WebM. Tu peux aussi glisser le fichier ici.</p>
          <input
            ref={picker}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/*"
            className="sr-only"
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" className="w-fit" onClick={() => picker.current?.click()}>
            Choisir un fichier
          </Button>
          <p className="text-sm">{file ? file.name : "Aucun fichier choisi"}</p>
        </div>
      </div>

      {preview ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <p className="px-4 py-3 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Aperçu</p>
          {fileIsVideo && preview ? (
            <video src={preview} controls className="aspect-video w-full bg-black" />
          ) : (
            <div className="relative aspect-[16/10] bg-muted">
              <Image
                src={preview}
                alt=""
                fill
                sizes="768px"
                className="object-cover"
                unoptimized={Boolean(preview)}
              />
            </div>
          )}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium">
        Titre
        <input
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-lg border border-input bg-transparent px-3 py-3 font-normal"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Courte description
        <textarea
          value={description}
          maxLength={300}
          rows={4}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-lg border border-input bg-transparent px-3 py-3 font-normal"
        />
      </label>

      {progress !== null ? <p className="text-sm text-muted-foreground">Envoi {progress} %</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-12 px-6" disabled={busy}>
          {busy ? "Publication…" : "Publier"}
        </Button>
        <Button type="button" variant="outline" className="h-12 px-6" disabled={busy} onClick={() => void submit("draft")}>
          Enregistrer comme brouillon
        </Button>
      </div>
    </form>
  );
}

function TypeButton({
  current,
  onClick,
  children,
}: {
  current: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={onClick}
      className={
        current
          ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          : "rounded-full border border-border px-4 py-2 text-sm font-medium"
      }
    >
      {children}
    </button>
  );
}
