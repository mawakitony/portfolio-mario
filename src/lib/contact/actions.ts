"use server";

import { contactSchema } from "@/lib/contact/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function sendContactMessage(
  _state: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    companyWebsite: formData.get("company_website"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Vérifie les champs. Le message doit rester lisible et complet.",
    };
  }

  if (parsed.data.companyWebsite) {
    return { status: "success" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    console.error("contact", error.code);
    return {
      status: "error",
      message: "Le message n'a pas pu être envoyé. Réessaie dans un instant.",
    };
  }

  return {
    status: "success",
    message: "Message reçu. MARDIGITAL revient vers toi.",
  };
}
