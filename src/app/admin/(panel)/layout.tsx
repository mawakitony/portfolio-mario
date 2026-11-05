import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

async function AdminGate({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="px-6 py-8 text-sm text-muted-foreground">
          Vérification de la session…
        </p>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
