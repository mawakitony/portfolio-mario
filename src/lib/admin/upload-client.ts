"use client";

import { Upload } from "tus-js-client";
import { directUploadLimit } from "@/lib/admin/media-rules";
import { explainStorageFailure, resumableEndpoint } from "@/lib/admin/storage-upload";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

const pathPattern = /^(library|projects)\/[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm)$/;

export async function uploadToStorage(options: {
  bucket: string;
  path: string;
  file: File;
  mime: string;
  onProgress: (value: number) => void;
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
}) {
  if (options.signal?.aborted) throw new Error("Envoi annulé.");
  if (options.file.size <= directUploadLimit) {
    try {
      await uploadDirect(options);
      return options.path;
    } catch (error) {
      if (!(error instanceof Error) || !isTooLarge(error.message)) throw error;
      options.onStatus?.("Fichier trop lourd pour l'envoi simple. Reprise par morceaux…");
    }
  }
  return uploadResumable(options);
}

async function uploadDirect(options: {
  bucket: string;
  path: string;
  file: File;
  mime: string;
  onProgress: (value: number) => void;
  signal?: AbortSignal;
}) {
  const { url, key } = getPublicSupabaseEnv();
  const supabase = createSupabaseBrowserClient();
  const token = await requireAccessToken(supabase);
  const encoded = options.path.split("/").map(encodeURIComponent).join("/");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cancel = () => {
      xhr.abort();
      reject(new Error("Envoi annulé."));
    };
    if (options.signal?.aborted) {
      cancel();
      return;
    }
    options.signal?.addEventListener("abort", cancel, { once: true });
    xhr.open("POST", `${url}/storage/v1/object/${options.bucket}/${encoded}`);
    xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("content-type", options.mime);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress(100);
        resolve();
        return;
      }
      reject(new Error(explainStorageFailure(xhr.status, xhr.responseText)));
    };
    xhr.onerror = () => reject(new Error("La connexion a été coupée. Réessaie avec le même fichier."));
    xhr.send(options.file);
  });
}

async function uploadResumable(options: {
  bucket: string;
  path: string;
  file: File;
  mime: string;
  onProgress: (value: number) => void;
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
}) {
  const { url } = getPublicSupabaseEnv();
  const supabase = createSupabaseBrowserClient();
  await requireAccessToken(supabase);
  const memory = rememberPath(options.bucket, options.file, options.path);
  let storedPath = memory.path;

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const succeed = (path: string) => {
      if (settled) return;
      settled = true;
      if (memory.key) sessionStorage.removeItem(memory.key);
      options.onProgress(100);
      resolve(path);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const upload = new Upload(options.file, {
      endpoint: resumableEndpoint(url),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: options.bucket,
        objectName: storedPath,
        contentType: options.mime,
        cacheControl: "3600",
      },
      onBeforeRequest: async (request) => {
        const token = await requireAccessToken(supabase);
        request.setHeader("Authorization", `Bearer ${token}`);
      },
      onShouldRetry: (error) => {
        const status = error.originalResponse?.getStatus() ?? 0;
        return status < 400 || status >= 500;
      },
      onError: (error) => {
        const message = error.message.toLowerCase();
        if (message.includes("409") || message.includes("already exists") || message.includes("resource already exists")) {
          succeed(storedPath);
          return;
        }
        if (memory.key && isAuthorizationFailure(message)) sessionStorage.removeItem(memory.key);
        fail(new Error(explainStorageFailure(0, error.message)));
      },
      onProgress: (sent, total) => {
        if (total > 0) options.onProgress(Math.round((sent / total) * 100));
      },
      onSuccess: () => succeed(storedPath),
    });

    const cancel = () => {
      upload.abort();
      fail(new Error("Envoi annulé."));
    };
    if (options.signal?.aborted) {
      cancel();
      return;
    }
    options.signal?.addEventListener("abort", cancel, { once: true });

    upload
      .findPreviousUploads()
      .then((previous) => {
        const match = previous.find(
          (item) =>
            item.metadata.bucketName === options.bucket &&
            item.metadata.objectName === storedPath &&
            Boolean(item.uploadUrl?.includes("/storage/v1/upload/resumable")) &&
            !item.uploadUrl?.includes("/upload/resumable/sign"),
        );
        if (match?.metadata.objectName) {
          storedPath = match.metadata.objectName;
          upload.resumeFromPreviousUpload(match);
          options.onStatus?.("Reprise de l'envoi interrompu…");
        }
        upload.start();
      })
      .catch((error: unknown) => {
        fail(error instanceof Error ? error : new Error("L'envoi n'a pas pu démarrer."));
      });
  });
}

function isTooLarge(message: string) {
  const text = message.toLowerCase();
  return text.includes("limite") || text.includes("too large") || text.includes("413");
}

function isAuthorizationFailure(text: string) {
  return text.includes("401") || text.includes("403") || text.includes("unauthorized") || text.includes("row-level") || text.includes("jws");
}

function rememberPath(bucket: string, file: File, fallback: string) {
  if (!pathPattern.test(fallback) || typeof sessionStorage === "undefined") {
    return { key: null as string | null, path: fallback };
  }
  const key = `mardigital-upload:${bucket}:${file.name}:${file.size}:${file.lastModified}`;
  const saved = sessionStorage.getItem(key);
  const path = saved && pathPattern.test(saved) ? saved : fallback;
  sessionStorage.setItem(key, path);
  return { key, path };
}

async function requireAccessToken(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("La session a expiré. Reconnecte-toi.");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("La session a expiré. Reconnecte-toi.");
  }
  return session.access_token;
}
