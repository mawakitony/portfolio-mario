/** Hôte Storage direct. L'envoi reprisable authentifié n'utilise pas /sign. */
export function resumableEndpoint(apiUrl: string) {
  const host = new URL(apiUrl).hostname;
  if (host.endsWith(".supabase.co")) {
    const projectRef = host.slice(0, -".supabase.co".length);
    return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${apiUrl.replace(/\/$/, "")}/storage/v1/upload/resumable`;
}

export function explainStorageFailure(status: number, raw: string) {
  if (process.env.NODE_ENV === "development") {
    console.error("[mardigital] réponse du stockage", { status, raw: raw.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jeton]") });
  }

  const detail = storageDetail(raw);
  if (
    status === 413 ||
    detail.includes("maximum") ||
    detail.includes("too large") ||
    detail.includes("entity too large") ||
    detail.includes("payload")
  ) {
    return "Ce fichier dépasse la limite autorisée par Supabase. Compresse-le, ou ajoute un lien YouTube ou Vimeo.";
  }
  if (detail.includes("jwt expired") || detail.includes("token is expired") || detail.includes("invalid claim")) {
    return "La session a expiré. Reconnecte-toi, puis réessaie avec le même fichier.";
  }
  if (
    detail.includes("invalid compact jws") ||
    detail.includes("signature verification") ||
    detail.includes("invalid jwt") ||
    detail.includes("bad_jwt")
  ) {
    return "Le jeton d'envoi a été refusé. Reconnecte-toi, puis réessaie avec le même fichier.";
  }
  if (detail.includes("row-level") || detail.includes("violates") || detail.includes("rls")) {
    return "Le stockage a refusé l'ajout du fichier. Les règles d'accès ont bloqué l'écriture.";
  }
  if (detail.includes("mime") || detail.includes("invalid mime")) {
    return "Ce format est refusé par le stockage. Utilise MP4, WebM, JPEG, PNG, WebP ou AVIF.";
  }
  if (detail.includes("network") || detail.includes("failed to fetch") || detail.includes("connection")) {
    return "La connexion a été coupée. Choisis à nouveau le même fichier : l'envoi reprendra où il s'est arrêté.";
  }
  const readable = readableStorageMessage(raw);
  if (readable) return `Le stockage a refusé le fichier : ${readable}`;
  return "Le stockage a refusé le fichier.";
}

function storageDetail(raw: string) {
  const parsed = parseStorageBody(raw);
  return `${raw} ${parsed?.message ?? ""} ${parsed?.error ?? ""} ${parsed?.code ?? ""}`.toLowerCase();
}

function readableStorageMessage(raw: string) {
  const message = parseStorageBody(raw)?.message?.trim();
  if (!message || message.length > 180) return null;
  return message;
}

function parseStorageBody(raw: string): { message?: string; error?: string; code?: string } | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
    };
    return {
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      error: typeof parsed.error === "string" ? parsed.error : undefined,
      code: typeof parsed.code === "string" ? parsed.code : undefined,
    };
  } catch {
    return null;
  }
}
