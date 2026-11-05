"use client";

import { useActionState } from "react";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { Button } from "@/components/ui/button";
import { sendContactMessage, type ContactState } from "@/lib/contact/actions";

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="font-display text-4xl">
        {state.message ?? "Message reçu."}
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div className="hidden" aria-hidden="true">
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      <MotionReveal variant="staggerDropDown" delay={0}>
        <Field label="Nom" name="name" autoComplete="name" required maxLength={120} />
      </MotionReveal>
      <MotionReveal variant="staggerDropDown" delay={0.1}>
        <Field label="E-mail" name="email" type="email" autoComplete="email" required maxLength={320} />
      </MotionReveal>
      <MotionReveal variant="staggerDropDown" delay={0.2}>
        <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" maxLength={40} />
      </MotionReveal>
      <MotionReveal variant="staggerDropDown" delay={0.3}>
        <Field label="Sujet" name="subject" maxLength={160} />
      </MotionReveal>
      <MotionReveal variant="staggerDropDown" delay={0.4}>
      <div className="grid gap-2">
        <label htmlFor="message" className="text-sm">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          className="rounded-lg border border-input bg-transparent px-3 py-3 text-sm outline-none transition-colors focus-visible:border-[#2078CF] focus-visible:ring-3 focus-visible:ring-[#2078CF]/40"
        />
      </div>
      </MotionReveal>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <MotionReveal variant="fadeScale" delay={0.5}>
      <Button type="submit" disabled={pending} className="motion-safe:transition-transform motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98]">
        {pending ? "Envoi…" : "Envoyer"}
      </Button>
      </MotionReveal>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength: number;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        className="h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-[#2078CF] focus-visible:ring-3 focus-visible:ring-[#2078CF]/40"
      />
    </div>
  );
}
