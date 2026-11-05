export type ActionState = {
  ok: boolean;
  message: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
};

export type AdminProjectListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  isFeatured: boolean;
  year: number | null;
  sortOrder: number;
  updatedAt: string;
  categories: string[];
  coverUrl: string | null;
};

export type AdminMedia = {
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  bucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  kind: "image" | "video" | "poster" | "embed";
  byteSize: number | null;
  altText: string | null;
  caption: string | null;
  role: "cover" | "gallery" | "video" | "document" | "poster";
  sortOrder: number;
  visibility: "private" | "public";
  provider: "storage" | "youtube" | "vimeo";
  externalUrl: string | null;
  externalId: string | null;
  posterMediaId: string | null;
  url: string | null;
};

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "read" | "archived";
  createdAt: string;
};

export type AdminService = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  items: string[];
  sortOrder: number;
  status: "draft" | "published";
};

export type ExternalLink = {
  label: string;
  url: string;
};
