"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { refreshPublicContent } from "@/lib/admin/revalidate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const visitorCookie = "mardigital_visitor";

export type LikeState = {
  ok: true;
  liked: boolean;
  count: number;
} | {
  ok: false;
  message: string;
};

async function visitorId() {
  const jar = await cookies();
  const current = jar.get(visitorCookie)?.value;
  if (current && z.uuid().safeParse(current).success) return current;
  const created = crypto.randomUUID();
  jar.set(visitorCookie, created, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return created;
}

function explain(error: { message?: string; code?: string }) {
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (text.includes("too many likes")) {
    return "Trop de likes en peu de temps. Réessaie plus tard.";
  }
  if (text.includes("publication unavailable")) {
    return "Cette publication n'est pas visible.";
  }
  if (text.includes("pgrst202") || text.includes("could not find") || text.includes("does not exist") || text.includes("42883")) {
    return "Les likes ne sont pas encore activés. La migration SQL doit être appliquée.";
  }
  return "Le like n'a pas pu être enregistré.";
}

export async function getLikeStates(projectIds: string[]): Promise<
  { ok: true; states: Record<string, { liked: boolean; count: number }> } | { ok: false; message: string }
> {
  const ids = [...new Set(projectIds.filter((id) => z.uuid().safeParse(id).success))].slice(0, 80);
  if (ids.length === 0) return { ok: true, states: {} };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_likes")
    .select("project_id, visitor_id")
    .in("project_id", ids);
  if (error) return { ok: false, message: explain(error) };

  const jar = await cookies();
  const visitor = jar.get(visitorCookie)?.value;
  const states: Record<string, { liked: boolean; count: number }> = {};
  for (const id of ids) states[id] = { liked: false, count: 0 };
  for (const row of data ?? []) {
    const current = states[row.project_id] ?? { liked: false, count: 0 };
    current.count += 1;
    if (visitor && row.visitor_id === visitor) current.liked = true;
    states[row.project_id] = current;
  }
  return { ok: true, states };
}

export async function toggleLike(projectId: string): Promise<LikeState> {
  if (!z.uuid().safeParse(projectId).success) {
    return { ok: false, message: "Cette publication est introuvable." };
  }
  const visitor = await visitorId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("toggle_project_like", {
    target_project: projectId,
    visitor,
  });
  if (error || typeof data !== "number") {
    return { ok: false, message: explain(error ?? { message: "like" }) };
  }
  const { data: mine } = await supabase
    .from("project_likes")
    .select("id")
    .eq("project_id", projectId)
    .eq("visitor_id", visitor)
    .maybeSingle();
  refreshPublicContent();
  return { ok: true, liked: Boolean(mine), count: data };
}
