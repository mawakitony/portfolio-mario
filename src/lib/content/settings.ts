import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { agency } from "@/lib/content/agency";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const text = z.string().trim().min(1);

const identitySchema = z.object({
  name: text.max(80),
  legalName: text.max(120),
  signature: text.max(80),
  director: text.max(120),
  role: text.max(80),
  promise: text.max(240),
});

const aboutSchema = z.object({ text: text.max(8000) });
const contactSchema = z.object({
  email: z.email().max(320),
  phones: z.string().max(200),
  location: text.max(80),
});
const socialSchema = z.object({
  instagram: z.url().nullable().optional(),
  facebook: z.url().nullable().optional(),
  linkedin: z.url().nullable().optional(),
  behance: z.url().nullable().optional(),
  youtube: z.url().nullable().optional(),
  tiktok: z.url().nullable().optional(),
});
const seoSchema = z.object({
  title: z.string().max(70).nullable(),
  description: z.string().max(180).nullable(),
});
const assetSchema = z.object({
  bucket: z.literal("images"),
  path: z.string().regex(/^branding\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/),
});
const brandingSchema = z.object({
  logo: assetSchema.nullable(),
  portrait: assetSchema.nullable(),
});

export type SiteContent = {
  name: string;
  legalName: string;
  signature: string;
  director: string;
  role: string;
  email: string;
  phones: { display: string; href: string }[];
  location: string;
  countryCode: string;
  promise: string;
  about: string[];
  social: { label: string; href: string }[];
  seoTitle: string;
  seoDescription: string;
  logoUrl: string | null;
  portraitUrl: string | null;
};

const fallbackDescription =
  "MARDIGITAL AGENCE, direction créative d'Amevor Kossi Mario. Branding, design graphique, image en mouvement, production vidéo, photographie, live streaming et formation. Togo.";

function phonesFrom(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((display) => ({
      display,
      href: `tel:${display.replace(/[^\d+]/g, "")}`,
    }));
}

function paragraphsFrom(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

async function signAsset(asset: { bucket: string; path: string } | null) {
  if (!asset) return null;
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.storage.from(asset.bucket).createSignedUrl(asset.path, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag("settings");
  cacheLife("minutes");

  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const values = new Map((data ?? []).map((row) => [row.key, row.value]));

  const identity = identitySchema.safeParse(values.get("identity"));
  const about = aboutSchema.safeParse(values.get("about"));
  const contact = contactSchema.safeParse(values.get("contact"));
  const social = socialSchema.safeParse(values.get("social"));
  const seo = seoSchema.safeParse(values.get("seo"));
  const branding = brandingSchema.safeParse(values.get("branding"));

  const phones = contact.success ? phonesFrom(contact.data.phones) : agency.phones;
  const configured = social.success
    ? social.data
    : { instagram: null, facebook: null, linkedin: null, behance: null, youtube: null, tiktok: null };
  const socialLinks = (
    [
      ["Instagram", configured.instagram],
      ["Facebook", configured.facebook],
      ["TikTok", configured.tiktok],
      ["YouTube", configured.youtube],
      ["Behance", configured.behance ?? "https://www.behance.net/mariodesign2"],
      ["LinkedIn", configured.linkedin],
    ] as const
  ).flatMap(([label, href]) => (typeof href === "string" && href.length > 0 ? [{ label, href }] : []));

  const logo = branding.success ? branding.data.logo : null;
  const portrait = branding.success ? branding.data.portrait : null;

  return {
    name: identity.success ? identity.data.name : agency.name,
    legalName: identity.success ? identity.data.legalName : agency.legalName,
    signature: identity.success ? identity.data.signature : agency.signature,
    director: identity.success ? identity.data.director : agency.director,
    role: identity.success ? identity.data.role : agency.role,
    email: contact.success ? contact.data.email : agency.email,
    phones: (phones.length > 0 ? phones : agency.phones).map((phone) => ({
      display: phone.display,
      href: phone.href,
    })),
    location: contact.success ? contact.data.location : agency.location,
    countryCode: agency.countryCode,
    promise: identity.success ? identity.data.promise : agency.promise,
    about: about.success ? paragraphsFrom(about.data.text) : [...agency.about],
    social: socialLinks,
    seoTitle: seo.success && seo.data.title ? seo.data.title : agency.name,
    seoDescription: seo.success && seo.data.description ? seo.data.description : fallbackDescription,
    logoUrl: await signAsset(logo),
    portraitUrl: await signAsset(portrait),
  };
}
