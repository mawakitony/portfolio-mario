import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  ["1", "Présentation"],
  ["2", "Images et vidéos"],
  ["3", "Publication"],
] as const;

export function Steps({ current, base }: { current: "1" | "2" | "3"; base: string }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {steps.map(([id, label]) => {
        const active = current === id;
        return (
          <li key={id}>
            <Link
              href={`${base}?etape=${id}`}
              aria-current={active ? "step" : undefined}
              className={cn(
                "block border px-4 py-3",
                active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
              )}
            >
              <span className="text-xs tracking-[0.16em] text-brand uppercase">{id}</span>
              <span className="mt-1 block text-sm">{label}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
