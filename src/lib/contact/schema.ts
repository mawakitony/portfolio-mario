import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(320),
  phone: z.preprocess(emptyToNull, z.string().max(40).nullable()),
  subject: z.preprocess(emptyToNull, z.string().max(160).nullable()),
  message: z.string().trim().min(1).max(5000),
  companyWebsite: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
