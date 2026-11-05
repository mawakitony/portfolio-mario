export function getPublicSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Les variables publiques Supabase sont absentes.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL n'est pas une URL valide.");
  }

  if (parsed.protocol !== "https:" || parsed.hostname === "supabase.com") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL doit être l'URL d'API du projet, pas une page du tableau de bord.",
    );
  }

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "La clé secrète Supabase ne peut pas servir de clé publique.",
    );
  }

  return { url, key };
}
