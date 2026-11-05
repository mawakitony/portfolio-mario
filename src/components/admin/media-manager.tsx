"use client";

import { Play, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  addEmbed,
  attachMedia,
  deleteMedia,
  detachMedia,
  discardUnregisteredUpload,
  registerUploadedMedia,
  reorderMedia,
  setCover,
  setPoster,
  updateMediaDetails,
} from "@/lib/admin/actions/media";
import { resolveMediaFile } from "@/lib/admin/media-rules";
import type { AdminMedia } from "@/lib/admin/types";
import { uploadToStorage } from "@/lib/admin/upload-client";
import { areaClass, controlClass } from "@/components/admin/feedback";
import { Button } from "@/components/ui/button";

type Job = { id: string; name: string; progress: number; message?: string; ok?: boolean };

export function MediaManager({
  projectId,
  media,
  projects,
  returnTo,
}: {
  projectId: string | null;
  media: AdminMedia[];
  projects: { id: string; title: string }[];
  returnTo: string;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [order, setOrder] = useState(media);
  const [dragId, setDragId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const transfers = useRef(new Map<string, AbortController>());

  async function send(files: File[]) {
    for (const file of files) {
      const id = crypto.randomUUID();
      const resolved = resolveMediaFile(file);
      if (!resolved.ok) {
        setJobs((current) => [...current, { id, name: file.name, progress: 100, ok: false, message: resolved.message }]);
        continue;
      }
      const path = `${projectId ? "projects" : "library"}/${crypto.randomUUID()}.${resolved.media.extension}`;
      const controller = new AbortController();
      transfers.current.set(id, controller);
      setJobs((current) => [...current, { id, name: file.name, progress: 0 }]);
      let uploadedPath: string | null = null;
      try {
        uploadedPath = await uploadToStorage({
          bucket: resolved.media.bucket,
          path,
          file,
          mime: resolved.media.mime,
          signal: controller.signal,
          onProgress: (progress) => {
            setJobs((current) => current.map((job) => (job.id === id ? { ...job, progress } : job)));
          },
          onStatus: (message) => {
            setJobs((current) => current.map((job) => (job.id === id ? { ...job, message } : job)));
          },
        });
        const result = await registerUploadedMedia({
          projectId,
          bucket: resolved.media.bucket,
          path: uploadedPath,
          mime: resolved.media.mime,
        });
        setJobs((current) =>
          current.map((job) =>
            job.id === id ? { ...job, progress: 100, ok: result.ok, message: result.message } : job,
          ),
        );
        if (result.ok) router.refresh();
        else await discardUnregisteredUpload({ bucket: resolved.media.bucket, path: uploadedPath });
      } catch (error) {
        if (uploadedPath) {
          await discardUnregisteredUpload({ bucket: resolved.media.bucket, path: uploadedPath });
        }
        setJobs((current) =>
          current.map((job) =>
            job.id === id
              ? { ...job, progress: 100, ok: false, message: error instanceof Error ? error.message : "L'envoi n'a pas abouti." }
              : job,
          ),
        );
      } finally {
        transfers.current.delete(id);
      }
    }
  }

  function dropOrder(targetId: string) {
    if (!projectId || !dragId || dragId === targetId) return;
    const next = [...order];
    const from = next.findIndex((item) => item.id === dragId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    startTransition(async () => {
      await reorderMedia({ projectId, ids: next.map((entry) => entry.id) });
      router.refresh();
    });
  }

  const images = order.filter((item) => item.kind === "image" || item.kind === "poster");

  return (
    <section className="grid gap-6">
      <div
        className={`rounded-2xl border border-dashed bg-card px-6 py-12 text-center ${dragOver ? "border-brand" : "border-border"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void send([...event.dataTransfer.files]);
        }}
      >
        <UploadCloud className="mx-auto size-8 text-brand" aria-hidden />
        <p className="mt-4 font-display text-3xl">Ajouter des images ou des vidéos</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Images jusqu&apos;à 10 Mo. Vidéos MP4 ou WebM jusqu&apos;à 100 Mo. Si l&apos;envoi s&apos;interrompt,
          choisis à nouveau le même fichier : il reprend là où il s&apos;est arrêté. Une vidéo trop lourde
          pour Supabase peut être ajoutée par un lien YouTube ou Vimeo.
        </p>
        <label className="mt-6 inline-flex h-10 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground">
          Choisir des fichiers
          <input
            type="file"
            multiple
            className="sr-only"
            accept=".jpg,.jpeg,.png,.webp,.avif,.mp4,.webm,image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/*"
            onChange={(event) => {
              void send([...(event.target.files ?? [])]);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {jobs.length > 0 ? (
        <ul className="grid gap-3">
          {jobs.map((job) => (
            <li key={job.id} className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span>{job.name}</span>
                <span className={job.ok === false ? "text-destructive" : "text-muted-foreground"}>
                  {job.message ?? `${job.progress}%`}
                </span>
              </div>
              <div className="h-1 bg-muted">
                <div className="h-full bg-primary" style={{ width: `${job.progress}%` }} />
              </div>
              {job.ok === undefined && job.progress < 100 ? (
                <button
                  type="button"
                  className="w-fit text-xs text-muted-foreground underline underline-offset-4"
                  onClick={() => transfers.current.get(job.id)?.abort()}
                >
                  Annuler
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {projectId ? (
        <form action={addEmbed} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="grid gap-2 text-sm">
            Lien YouTube ou Vimeo
            <input name="url" required placeholder="https://www.youtube.com/watch?v=…" className={controlClass} />
            <span className="text-xs text-muted-foreground">
              Exemple : une vidéo déjà en ligne. Le lien est vérifié avant d&apos;être ajouté.
            </span>
          </label>
          <Button type="submit" variant="outline">
            Ajouter le lien
          </Button>
        </form>
      ) : null}

      {order.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun média pour le moment.</p>
      ) : (
        <ul className={projectId ? "grid gap-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
          {order.map((item) => (
            <li
              key={item.id}
              draggable={Boolean(projectId)}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOrder(item.id)}
              className="grid gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <Preview item={item} />
              <div className="grid gap-3">
                <p className="text-sm">{describeMedia(item)}</p>
                <form action={updateMediaDetails} className="grid gap-3">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <input name="altText" defaultValue={item.altText ?? ""} placeholder="Texte alternatif" className={controlClass} />
                  <textarea name="caption" defaultValue={item.caption ?? ""} placeholder="Légende" className={areaClass} />
                  <Button type="submit" variant="outline" size="sm">
                    Enregistrer le texte
                  </Button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {projectId && item.kind === "image" ? (
                    <form action={setCover}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button type="submit" variant="outline" size="sm">
                        Choisir comme miniature principale
                      </Button>
                    </form>
                  ) : null}
                  {item.projectId ? (
                    <form action={detachMedia}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button type="submit" variant="outline" size="sm">
                        Détacher
                      </Button>
                    </form>
                  ) : (
                    <form action={attachMedia} className="flex gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <select name="projectId" className={controlClass} defaultValue="">
                        <option value="" disabled>
                          Associer à…
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        Associer
                      </Button>
                    </form>
                  )}
                  <form action={deleteMedia} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
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
                {projectId && (item.kind === "video" || item.kind === "embed") ? (
                  <form action={setPoster} className="flex gap-2">
                    <input type="hidden" name="videoId" value={item.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <select name="posterId" defaultValue={item.posterMediaId ?? ""} className={controlClass}>
                      <option value="">Sans miniature</option>
                      {images.map((image) => (
                        <option key={image.id} value={image.id}>
                          {image.altText || image.caption || "Image"}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="outline" size="sm">
                      Miniature
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {projectId && order.length > 1 ? (
        <p className="text-sm text-muted-foreground">Glisse une ligne pour changer l&apos;ordre.</p>
      ) : null}
      {pending ? <p className="text-sm text-muted-foreground">Réorganisation…</p> : null}
    </section>
  );
}

function describeMedia(item: AdminMedia) {
  const kind = item.kind === "image" ? "Image" : item.kind === "poster" ? "Miniature" : "Vidéo";
  const cover = item.role === "cover" ? " · miniature principale" : "";
  const state = item.visibility === "public" ? "visible sur le site" : "pas encore sur le site";
  const where = item.projectTitle ? ` · ${item.projectTitle}` : item.projectId ? "" : " · non associée";
  const size = formatBytes(item.byteSize);
  const mime = item.mimeType ? ` · ${item.mimeType}` : "";
  return `${kind}${cover} · ${state}${where}${size ? ` · ${size}` : ""}${mime}`;
}

function formatBytes(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} Ko`;
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
}

function Preview({ item }: { item: AdminMedia }) {
  const [play, setPlay] = useState(false);
  if (item.provider === "youtube" && item.externalId) {
    return (
      <Image
        src={`https://i.ytimg.com/vi/${item.externalId}/hqdefault.jpg`}
        alt=""
        width={480}
        height={360}
        className="aspect-video w-full object-cover"
      />
    );
  }
  if ((item.kind === "video" || item.kind === "embed") && !item.url) {
    return <div className="grid aspect-video w-full place-items-center bg-muted text-sm">Vidéo en ligne</div>;
  }
  if (item.kind === "video" && item.url) {
    if (!play || !item.url) {
      return (
        <button
          type="button"
          className="relative grid aspect-video w-full place-items-center bg-muted text-sm"
          onClick={() => item.url && setPlay(true)}
        >
          <Play className="size-8 text-brand" aria-hidden />
          <span className="sr-only">Lire la vidéo</span>
        </button>
      );
    }
    return <video src={item.url} className="aspect-video w-full bg-black" controls autoPlay preload="metadata" />;
  }
  if (item.url && (item.kind === "image" || item.kind === "poster")) {
    return <Image src={item.url} alt={item.altText ?? ""} width={640} height={480} className="aspect-[4/3] w-full object-cover" />;
  }
  return <div className="grid aspect-video place-items-center bg-card text-xs text-muted-foreground">Aperçu</div>;
}
