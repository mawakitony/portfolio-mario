"use client";

import { usePathname } from "next/navigation";

export function SectionLink({
  id,
  className,
  children,
  onNavigate,
  current,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  current?: boolean;
}) {
  const pathname = usePathname();
  const href = pathname === "/" ? `#${id}` : `/#${id}`;

  return (
    <a
      href={href}
      className={className}
      aria-current={current ? "true" : undefined}
      onClick={(event) => {
        const target = document.getElementById(id);
        if (target && window.location.pathname === "/") {
          event.preventDefault();
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
