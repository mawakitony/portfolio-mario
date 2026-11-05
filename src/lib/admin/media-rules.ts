export const mediaRules = {
  images: {
    bucket: "images",
    kind: "image",
    maxBytes: 10 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  videos: {
    bucket: "videos",
    kind: "video",
    maxBytes: 100 * 1024 * 1024,
    types: ["video/mp4", "video/webm"],
  },
  posters: {
    bucket: "posters",
    kind: "poster",
    maxBytes: 10 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
} as const;

export type MediaKind = "image" | "video" | "poster";

export function ruleForFile(file: File) {
  return Object.values(mediaRules).find((rule) =>
    (rule.types as readonly string[]).includes(file.type),
  );
}

export function extensionFor(type: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[type] ?? null;
}

const catalog = [
  { extensions: ["jpg", "jpeg"], mime: "image/jpeg", bucket: "images", kind: "image", maxBytes: mediaRules.images.maxBytes },
  { extensions: ["png"], mime: "image/png", bucket: "images", kind: "image", maxBytes: mediaRules.images.maxBytes },
  { extensions: ["webp"], mime: "image/webp", bucket: "images", kind: "image", maxBytes: mediaRules.images.maxBytes },
  { extensions: ["avif"], mime: "image/avif", bucket: "images", kind: "image", maxBytes: mediaRules.images.maxBytes },
  { extensions: ["mp4"], mime: "video/mp4", bucket: "videos", kind: "video", maxBytes: mediaRules.videos.maxBytes },
  { extensions: ["webm"], mime: "video/webm", bucket: "videos", kind: "video", maxBytes: mediaRules.videos.maxBytes },
] as const;

export type ResolvedMedia = {
  mime: string;
  extension: string;
  bucket: "images" | "videos" | "posters";
  kind: "image" | "video";
  maxBytes: number;
};

/** Le POST direct de Storage est refusé au-delà d'environ 6 Mo. */
export const directUploadLimit = 6 * 1024 * 1024;

export function resolveMediaFile(file: File): { ok: true; media: ResolvedMedia } | { ok: false; message: string } {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const match = catalog.find((item) => (item.extensions as readonly string[]).includes(extension));
  if (!match) {
    return {
      ok: false,
      message: "Ce format n'est pas accepté. Choisis une image JPEG, PNG, WebP ou AVIF, ou une vidéo MP4 ou WebM.",
    };
  }

  const browserType = file.type.trim().toLowerCase();
  if (browserType && browserType !== "application/octet-stream" && browserType !== match.mime) {
    const sameFamily =
      (match.kind === "video" && (browserType.startsWith("video/") || browserType === "application/mp4")) ||
      (match.kind === "image" && browserType.startsWith("image/"));
    if (!sameFamily) {
      return { ok: false, message: "Le type du fichier ne correspond pas à son nom." };
    }
  }

  if (file.size > match.maxBytes) {
    const limit = Math.round(match.maxBytes / (1024 * 1024));
    if (match.kind === "video") {
      return {
        ok: false,
        message: `Cette vidéo dépasse ${limit} Mo, la limite du dossier vidéos. Compresse-la, ou ajoute un lien YouTube ou Vimeo.`,
      };
    }
    return { ok: false, message: `Cette image dépasse ${limit} Mo.` };
  }

  return {
    ok: true,
    media: {
      mime: match.mime,
      extension: extension === "jpeg" ? "jpg" : extension,
      bucket: match.bucket,
      kind: match.kind,
      maxBytes: match.maxBytes,
    },
  };
}
