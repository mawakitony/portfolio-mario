import { z } from "zod";

const slug = z
  .string()
  .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L'adresse ne peut contenir que des minuscules et des tirets.")
    .max(80, "L'adresse est trop longue.");

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} est trop long.`)
    .transform((value) => (value.length === 0 ? null : value));

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((value) => (value.length === 0 ? null : value))
  .refine((value) => value === null || z.url().safeParse(value).success, "Adresse web invalide.");

export const projectFieldsSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(160, "Le titre est trop long."),
  slug,
  excerpt: optionalText(300, "La description courte"),
  description: optionalText(20000, "La description"),
  clientName: optionalText(160, "Le client"),
  year: z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) return true;
      const year = Number(value);
      return Number.isInteger(year) && year >= 1900 && year <= 2100;
    }, "L'année doit être comprise entre 1900 et 2100.")
    .transform((value) => (value.length === 0 ? null : Number(value))),
  tools: z.array(z.string().trim().min(1).max(40)).max(30, "30 outils maximum."),
  categoryIds: z.array(z.uuid()).max(20),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  status: z.enum(["draft", "published"]),
  seoTitle: optionalText(70, "Le titre SEO"),
  seoDescription: optionalText(180, "La description SEO"),
});

export const externalLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.url().max(500),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(80),
  slug,
  description: optionalText(300, "La description"),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(80),
  legalName: z.string().trim().min(1, "La raison sociale est requise.").max(120),
  signature: z.string().trim().min(1).max(80),
  director: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(80),
  promise: z.string().trim().min(1).max(240),
  about: z.string().trim().min(1, "La présentation est requise.").max(8000),
  email: z.email("L'adresse e-mail est invalide.").max(320),
  phones: z.string().trim().max(200),
  location: z.string().trim().min(1).max(80),
  instagram: optionalUrl,
  facebook: optionalUrl,
  linkedin: optionalUrl,
  behance: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalUrl,
  seoTitle: optionalText(70, "Le titre SEO"),
  seoDescription: optionalText(180, "La description SEO"),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis.").max(80),
  slug,
  summary: optionalText(300, "Le résumé"),
  body: optionalText(4000, "Le texte"),
  items: z.array(z.string().trim().min(1).max(120)).max(20),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  status: z.enum(["draft", "published"]),
});

export function splitList(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readLinks(formData: FormData) {
  const labels = formData.getAll("linkLabel");
  const urls = formData.getAll("linkUrl");
  const pairs = labels.flatMap((label, index) => {
    const url = urls[index];
    if (typeof label !== "string" || typeof url !== "string") return [];
    if (label.trim().length === 0 && url.trim().length === 0) return [];
    return [{ label, url }];
  });
  return z.array(externalLinkSchema).max(8, "8 liens maximum.").safeParse(pairs);
}
