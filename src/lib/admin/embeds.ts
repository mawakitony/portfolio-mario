export function parseEmbed(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    const fromQuery = url.searchParams.get("v");
    const fromPath = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    const id = (host === "youtu.be" ? fromPath : fromQuery || fromPath).trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { provider: "youtube" as const, id, url: url.toString() };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter((part) => /^\d{6,12}$/.test(part)).at(-1);
    if (!id) return null;
    return { provider: "vimeo" as const, id, url: url.toString() };
  }

  return null;
}
