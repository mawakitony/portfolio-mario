import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/lib/portfolio/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const result = await getPublishedProjects();
  const projects = result.ok ? result.data : [];
  const now = new Date();
  const staticRoutes = ["", "/galerie"].map(
    (path) => ({
      url: `${siteUrl}${path || "/"}`,
      lastModified: now,
    }),
  );

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${siteUrl}/portfolio/${project.slug}`,
      lastModified: now,
    })),
  ];
}
