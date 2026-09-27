import { z } from "zod";

export const sponsorTierSchema = z.enum([
  "Title Partner",
  "Official Partner",
  "Technical Partner",
  "Supporter",
]);

export type SponsorTier = z.infer<typeof sponsorTierSchema>;

export const messageStatusSchema = z.enum([
  "unread",
  "read",
  "replied",
  "archived",
]);

export type MessageStatus = z.infer<typeof messageStatusSchema>;

export const articleStatusSchema = z.enum(["draft", "published", "scheduled"]);

export type ArticleStatus = z.infer<typeof articleStatusSchema>;

export const cloudinaryImageSchema = z.object({
  secureUrl: z.string().url(),
  publicId: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
});

export type CloudinaryImage = z.infer<typeof cloudinaryImageSchema>;

export const homepageSectionKeys = [
  "hero",
  "athlete",
  "statistics",
  "career",
  "ocean",
  "gallery",
  "videos",
  "sponsors",
  "journal",
  "contact",
] as const;

export type HomepageSectionKey = (typeof homepageSectionKeys)[number];

export interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  image?: CloudinaryImage | null;
  videoUrl?: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  updatedAt?: unknown;
}

export interface AthleteProfile {
  name: string;
  professionalTitle: string;
  shortBiography: string;
  fullBiography: string;
  nationality: string;
  yearsActive: string;
  maximumDepth: string;
  competitionsCount: string;
  podiumsCount: string;
  countriesVisited: string;
  profileImage?: CloudinaryImage | null;
  updatedAt?: unknown;
}

export interface AthleteStat {
  id: string;
  number: string;
  label: string;
  icon: string;
  order: number;
  visible: boolean;
}

export interface Achievement {
  id: string;
  competitionName: string;
  year: string;
  location: string;
  country: string;
  position: string;
  score: string;
  category: string;
  description: string;
  image?: CloudinaryImage | null;
  featured: boolean;
  order: number;
  published: boolean;
  visible: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  country: string;
  description: string;
  position: string;
  score: string;
  participants: string;
  image?: CloudinaryImage | null;
  galleryIds: string[];
  videoId?: string | null;
  achievementId?: string | null;
  featured: boolean;
  published: boolean;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  cloudinaryPublicId: string;
  description: string;
  website: string;
  instagram: string;
  category: string;
  tier: SponsorTier;
  featured: boolean;
  active: boolean;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  date: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  views: number;
  featured: boolean;
  published: boolean;
  visible: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  /** Uploaded Cloudinary video URL (optional alternative to YouTube) */
  videoUrl?: string;
  videoPublicId?: string;
  thumbnail?: CloudinaryImage | null;
  description: string;
  category: string;
  date: string;
  featured: boolean;
  published: boolean;
  visible: boolean;
  order: number;
  views: number;
  clicks: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: CloudinaryImage | null;
  category: string;
  author: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  status: ArticleStatus;
  published: boolean;
  featured: boolean;
  visible: boolean;
  publishDate: string;
  views: number;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt?: unknown;
}

export interface SocialLinks {
  instagram: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  linkedin: string;
  x: string;
  email: string;
}

export interface SeoPage {
  title: string;
  description: string;
  ogImage?: CloudinaryImage | null;
}

export interface SiteSettings {
  websiteName: string;
  athleteName: string;
  email: string;
  phone: string;
  location: string;
  defaultLanguage: string;
  timezone: string;
  copyright: string;
  maintenanceMode: boolean;
}

export interface HomepageSection {
  key: HomepageSectionKey;
  enabled: boolean;
  order: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp?: unknown;
}

export interface DailyAnalytics {
  visitors: number;
  pageViews: number;
  galleryViews: number;
  videoClicks: number;
  messages: number;
}

export const PAGE_SIZE = 20;
