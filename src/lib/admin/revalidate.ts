import "server-only";
import { revalidatePath, updateTag } from "next/cache";

export function refreshPublicContent(slug?: string) {
  updateTag("projects");
  updateTag("services");
  updateTag("settings");
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/galerie");
  revalidatePath("/showreel");
  revalidatePath("/services");
  revalidatePath("/a-propos");
  revalidatePath("/contact");
  if (slug) revalidatePath(`/portfolio/${slug}`);
}
