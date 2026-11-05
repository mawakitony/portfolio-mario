import { coverOf, videosOf, type PublicProject } from "@/lib/portfolio/queries";

export type ImageCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  src: string | null;
  alt: string;
  likeCount: number | null;
};

export function imageCardsFrom(projects: PublicProject[]): ImageCard[] {
  return projects
    .filter((project) => {
      const hasImage = project.media.some((item) => (item.kind === "image" || item.kind === "poster") && item.url);
      return hasImage || videosOf(project).length === 0;
    })
    .map((project) => {
      const cover = coverOf(project);
      return {
        id: project.id,
        title: project.title,
        slug: project.slug,
        excerpt: project.excerpt,
        src: cover?.url ?? null,
        alt: cover?.alt_text || project.title,
        likeCount: project.likeCount,
      };
    });
}
