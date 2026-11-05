"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeBrandingAsset, setBrandingAsset } from "@/lib/admin/actions/settings";
import { resolveMediaFile } from "@/lib/admin/media-rules";
import { uploadToStorage } from "@/lib/admin/upload-client";
import { Button } from "@/components/ui/button";

export function BrandingControl({
  kind,
  label,
  url,
}: {
  kind: "logo" | "portrait";
  label: string;
  url: string | null;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  async function send(file: File) {
    const resolved = resolveMediaFile(file);
    if (!resolved.ok || resolved.media.kind !== "image") {
      setOk(false);
      setMessage(resolved.ok ? "Choisis une image JPEG, PNG, WebP ou AVIF." : resolved.message);
      return;
    }
    const path = `branding/${crypto.randomUUID()}.${resolved.media.extension}`;
    setProgress(0);
    setMessage(null);
    try {
      await uploadToStorage({
        bucket: "images",
        path,
        file,
        mime: resolved.media.mime,
        onProgress: setProgress,
      });
      const result = await setBrandingAsset({ kind, bucket: "images", path });
      setOk(result.ok);
      setMessage(result.message);
      if (result.ok) router.refresh();
    } catch (error) {
      setOk(false);
      setMessage(error instanceof Error ? error.message : "L'envoi a échoué.");
    }
  }

  return (
    <div className="grid gap-3 border border-border p-4">
      <p className="text-sm">{label}</p>
      {url ? <Image src={url} alt="" width={320} height={160} className="max-h-28 w-auto object-contain" /> : (
        <p className="text-sm text-muted-foreground">Aucune image enregistrée.</p>
      )}
      <label className="text-sm underline underline-offset-4">
        Remplacer
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void send(file);
            event.target.value = "";
          }}
        />
      </label>
      {progress !== null ? (
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {message ? <p className={ok ? "text-sm text-brand" : "text-sm text-destructive"}>{message}</p> : null}
      {url ? (
        <form action={removeBrandingAsset}>
          <input type="hidden" name="kind" value={kind} />
          <Button type="submit" variant="outline" size="sm">
            Retirer
          </Button>
        </form>
      ) : null}
    </div>
  );
}
