import { Suspense } from "react";
import { LoginForm } from "@/app/admin/login/login-form";

export const metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

const notices: Record<string, string> = {
  role: "Ce compte n'a pas le rôle administrateur.",
  profil:
    "Le profil est inaccessible. Applique les migrations avant d'attribuer le rôle admin.",
};

async function LoginNotice({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const params = await searchParams;
  const notice = params.erreur ? notices[params.erreur] : undefined;
  return <LoginForm notice={notice} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
        Administration
      </p>
      <h1 className="mt-4 text-4xl tracking-tight">Connexion</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Réservé au compte auquel le rôle admin a été attribué explicitement.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <LoginNotice searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
