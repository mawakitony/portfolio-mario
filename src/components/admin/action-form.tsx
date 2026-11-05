"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/lib/admin/types";
import { Notice } from "@/components/admin/feedback";

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: ActionState | null, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  const warn = dirty && !state?.ok;

  useEffect(() => {
    if (!warn) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [warn]);

  return (
    <form action={formAction} className={className} onInput={() => setDirty(true)}>
      <fieldset disabled={pending} className="grid gap-5 disabled:opacity-60">
        {children}
      </fieldset>
      <div className="mt-4 grid gap-2">
        <Notice state={state} />
        {pending ? <p className="text-sm text-muted-foreground">Enregistrement…</p> : null}
      </div>
    </form>
  );
}
