import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedErrors = new Set(["role", "profil"]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const destination = new URL("/admin/login", requestUrl.origin);
  const erreur = requestUrl.searchParams.get("erreur");
  if (erreur && allowedErrors.has(erreur)) {
    destination.searchParams.set("erreur", erreur);
  }

  return NextResponse.redirect(destination);
}
