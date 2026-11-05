"use client";

import { useState } from "react";
import { slugify } from "@/lib/admin/slug";
import { controlClass, Field } from "@/components/admin/feedback";

export function SlugFields({
  defaultTitle = "",
  defaultSlug = "",
  titleName = "title",
  titleLabel = "Titre",
  titleHint,
  slugLabel = "Slug",
  slugHint = "Adresse de la page.",
}: {
  defaultTitle?: string;
  defaultSlug?: string;
  titleName?: string;
  titleLabel?: string;
  titleHint?: string;
  slugLabel?: string;
  slugHint?: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [touched, setTouched] = useState(defaultSlug.length > 0);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field label={titleLabel} hint={titleHint}>
        <input
          required
          name={titleName}
          value={title}
          maxLength={160}
          className={controlClass}
          onChange={(event) => {
            const next = event.target.value;
            setTitle(next);
            if (!touched) setSlug(slugify(next));
          }}
        />
      </Field>
      <Field label={slugLabel} hint={slugHint}>
        <input
          required
          name="slug"
          value={slug}
          maxLength={80}
          className={controlClass}
          onChange={(event) => {
            setTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />
      </Field>
    </div>
  );
}
