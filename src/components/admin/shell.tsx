"use client";

import {
  ExternalLink,
  FolderKanban,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primary = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/publications/nouvelle", label: "Ajouter une publication", icon: Plus },
  { href: "/admin/projets", label: "Mes publications", icon: FolderKanban },
  { href: "/admin/mediatheque", label: "Médias", icon: Images },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function current(pathname: string, href: string, exact?: boolean) {
  const path = href.split("#")[0] ?? href;
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const open = openPath === pathname;
  const panelId = useId();

  function toggleCollapsed() {
    setCollapsed((value) => !value);
  }

  return (
    <div className="min-h-svh bg-background md:grid md:grid-cols-[auto_1fr]">
      <aside
        className={cn(
          "sticky top-0 hidden h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
          collapsed ? "w-[4.75rem]" : "w-72",
        )}
      >
        <SidebarBody
          email={email}
          pathname={pathname}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:px-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md text-sm focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
            {open ? "Fermer" : "Menu"}
          </button>
          <p className="hidden font-display text-2xl md:block">Espace de création</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">Site</span>
            </Link>
          </div>
        </header>
        {open ? (
          <nav id={panelId} aria-label="Administration mobile" className="border-b border-border bg-sidebar px-4 py-4 md:hidden">
            <NavList pathname={pathname} collapsed={false} />
          </nav>
        ) : null}
        <div className="px-4 py-8 md:px-8 md:py-10">{children}</div>
      </div>
    </div>
  );
}

function SidebarBody({
  email,
  pathname,
  collapsed,
  onToggle,
}: {
  email: string | null;
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-between px-3 py-5">
      <div>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
          {collapsed ? (
            <p className="font-display text-2xl text-brand">M</p>
          ) : (
            <div>
              <p className="text-[0.68rem] tracking-[0.22em] text-brand uppercase">MARDIGITAL</p>
              <p className="font-display text-3xl leading-none">Agence</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {collapsed ? <span className="sr-only">Agrandir le menu</span> : <span>Réduire</span>}
        </button>
        <nav aria-label="Administration" className="mt-6">
          <NavList pathname={pathname} collapsed={collapsed} />
        </nav>
      </div>
      <div className={cn("border-t border-sidebar-border pt-4", collapsed && "px-0")}>
        <p className={cn("truncate px-2 text-sm", collapsed && "sr-only")}>{email ?? "Administrateur"}</p>
        <form action={signOut} className="mt-2">
          <Button type="submit" variant="outline" className={cn("w-full", collapsed && "px-0")} aria-label="Déconnexion">
            <LogOut className="size-4" />
            {collapsed ? <span className="sr-only">Déconnexion</span> : "Déconnexion"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function NavList({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <div className="grid gap-1">
      {primary.map((item) => (
        <NavLink key={item.href} pathname={pathname} collapsed={collapsed} {...item} />
      ))}
      <Link
        href="/"
        className={cn(
          "mt-1 inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed && "justify-center px-0",
        )}
      >
        <ExternalLink className="size-4 shrink-0" />
        {collapsed ? <span className="sr-only">Voir le site public</span> : "Voir le site public"}
      </Link>
    </div>
  );
}

function NavLink({
  pathname,
  href,
  label,
  icon: Icon,
  exact,
  collapsed,
}: {
  pathname: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  collapsed: boolean;
}) {
  const active = current(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(
        "inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "bg-sidebar-accent text-foreground shadow-[inset_2px_0_0_var(--brand)]",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {collapsed ? <span className="sr-only">{label}</span> : label}
    </Link>
  );
}
