"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/likes/actions";
import { cn } from "@/lib/utils";

export function LikeButton({
  projectId,
  count,
  liked = false,
  overlay = false,
}: {
  projectId: string;
  count: number | null;
  liked?: boolean;
  overlay?: boolean;
}) {
  const [value, setValue] = useState(count);
  const [active, setActive] = useState(liked);
  const [message, setMessage] = useState<string | null>(null);
  const [pop, setPop] = useState(0);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (pending) return;
    setMessage(null);
    setPop((value) => value + 1);
    startTransition(async () => {
      const result = await toggleLike(projectId);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setActive(result.liked);
      setValue(result.count);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
          overlay
            ? active
              ? "border-primary bg-black/60 text-brand"
              : "border-white/25 bg-black/60 text-white"
            : active
              ? "border-primary bg-primary/15 text-brand"
              : "border-white/15 text-foreground",
        )}
      >
        <Heart key={pop} className={cn("size-4", pop > 0 && "heart-pop", active && "fill-current")} aria-hidden />
        <span className="sr-only">{active ? "Retirer le like" : "Aimer"}</span>
        <span>{value === null ? "—" : value}</span>
      </button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
