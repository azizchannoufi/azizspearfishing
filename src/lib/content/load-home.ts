import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  getAchievements,
  getArticles,
  getAthleteProfile,
  getAthleteStats,
  getCompetitions,
  getGallery,
  getHero,
  getHomepageSections,
  getSeo,
  getSiteSettings,
  getSocialLinks,
  getSponsors,
  getVideos,
} from "@/lib/content/public";
import type {
  Achievement,
  Article,
  AthleteProfile,
  AthleteStat,
  Competition,
  GalleryImage,
  HeroContent,
  HomepageSection,
  SeoPage,
  SiteSettings,
  SocialLinks,
  Sponsor,
  VideoItem,
} from "@/lib/firebase/types";

export type HomeCmsData = {
  configured: boolean;
  maintenanceMode: boolean;
  settings: SiteSettings | null;
  hero: HeroContent | null;
  sections: HomepageSection[];
  athlete: AthleteProfile | null;
  stats: AthleteStat[];
  achievements: Achievement[];
  competitions: Competition[];
  sponsors: Sponsor[];
  gallery: GalleryImage[];
  videos: VideoItem[];
  articles: Article[];
  social: SocialLinks | null;
  seo: SeoPage | null;
};

export async function loadHomeCms(): Promise<HomeCmsData> {
  if (!isFirebaseConfigured()) {
    return {
      configured: false,
      maintenanceMode: false,
      settings: null,
      hero: null,
      sections: [],
      athlete: null,
      stats: [],
      achievements: [],
      competitions: [],
      sponsors: [],
      gallery: [],
      videos: [],
      articles: [],
      social: null,
      seo: null,
    };
  }

  const [
    settings,
    hero,
    sections,
    athlete,
    stats,
    achievements,
    competitions,
    sponsors,
    gallery,
    videos,
    articles,
    social,
    seo,
  ] = await Promise.all([
    getSiteSettings(),
    getHero(),
    getHomepageSections(),
    getAthleteProfile(),
    getAthleteStats(),
    getAchievements(),
    getCompetitions(),
    getSponsors(),
    getGallery(),
    getVideos(),
    getArticles(6),
    getSocialLinks(),
    getSeo("home"),
  ]);

  return {
    configured: true,
    maintenanceMode: Boolean(settings?.maintenanceMode),
    settings,
    hero,
    sections: [...sections].sort((a, b) => a.order - b.order),
    athlete,
    stats,
    achievements,
    competitions,
    sponsors,
    gallery,
    videos,
    articles,
    social,
    seo,
  };
}
