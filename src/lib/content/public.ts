import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { getServerCmsDb } from "@/lib/firebase/server-cms";
import type {
  Achievement,
  Article,
  AthleteProfile,
  AthleteStat,
  Competition,
  GalleryImage,
  HeroContent,
  HomepageSection,
  SiteSettings,
  SocialLinks,
  Sponsor,
  VideoItem,
  SeoPage,
} from "@/lib/firebase/types";
import { homepageSectionKeys } from "@/lib/firebase/types";

function publicDbOrNull() {
  if (!isFirebaseConfigured()) return null;
  try {
    return getClientDb();
  } catch (err) {
    console.error("[cms] client db unavailable", err);
    return null;
  }
}

function sortByOrder<T extends { order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mapDocs<T>(docs: QueryDocumentSnapshot[]): T[] {
  return docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

async function getSingleDoc<T>(path: string): Promise<T | null> {
  const parts = path.split("/").filter(Boolean);
  const tryRead = async (db: Firestore) => {
    const snap = await getDoc(doc(db, parts[0]!, ...parts.slice(1)));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  };

  try {
    const publicDb = publicDbOrNull();
    if (publicDb) return await tryRead(publicDb);
  } catch (err) {
    console.warn(`[cms] public read failed for ${path}`, err);
  }

  try {
    const serverDb = await getServerCmsDb();
    if (serverDb) return await tryRead(serverDb);
  } catch (err) {
    console.error(`[cms] failed to read ${path}`, err);
  }
  return null;
}

type ListOpts = {
  requirePublished?: boolean;
  requireActive?: boolean;
};

async function listPublicDocs(name: string, opts: ListOpts = {}) {
  const requirePublished = opts.requirePublished === true;
  const requireActive = opts.requireActive === true;

  const passes = (data: DocumentData) => {
    if (requirePublished && data.published !== true) return false;
    if (requireActive && data.active === false) return false;
    if (data.visible === false) return false;
    return true;
  };

  const tryList = async (db: Firestore) => {
    const snap = await getDocs(collection(db, name));
    return snap.docs.filter((d) => passes(d.data()));
  };

  const tryFiltered = async (db: Firestore) => {
    const constraints = [];
    if (requireActive) constraints.push(where("active", "==", true));
    if (requirePublished) constraints.push(where("published", "==", true));
    constraints.push(where("visible", "==", true));
    constraints.push(orderBy("order", "asc"));
    const snap = await getDocs(query(collection(db, name), ...constraints));
    return snap.docs;
  };

  // 1) Public unauthenticated list
  try {
    const publicDb = publicDbOrNull();
    if (publicDb) return await tryList(publicDb);
  } catch {
    // expected until rules allow public list
  }

  // 2) Public filtered query (needs composite indexes)
  try {
    const publicDb = publicDbOrNull();
    if (publicDb) return await tryFiltered(publicDb);
  } catch {
    // expected until indexes exist
  }

  // 3) Admin-authenticated server read (works with current rules)
  try {
    const serverDb = await getServerCmsDb();
    if (serverDb) return await tryList(serverDb);
  } catch (err) {
    console.error(`[cms] failed to read ${name}`, err);
  }

  return [];
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return getSingleDoc<SiteSettings>("siteSettings/general");
}

export async function getHero(): Promise<HeroContent | null> {
  return getSingleDoc<HeroContent>("homepage/hero");
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const defaults = homepageSectionKeys.map((key, order) => ({
    key,
    enabled: true,
    order,
  }));
  try {
    const data = await getSingleDoc<{ items?: HomepageSection[] }>("homepage/sections");
    return data?.items?.length ? data.items : defaults;
  } catch {
    return defaults;
  }
}

export async function getAthleteProfile(): Promise<AthleteProfile | null> {
  return getSingleDoc<AthleteProfile>("athlete/profile");
}

export async function getAthleteStats(): Promise<AthleteStat[]> {
  const docs = await listPublicDocs("athleteStats");
  return sortByOrder(mapDocs<AthleteStat>(docs));
}

export async function getSponsors(): Promise<Sponsor[]> {
  const docs = await listPublicDocs("sponsors", { requireActive: true });
  return sortByOrder(mapDocs<Sponsor>(docs));
}

export async function getGallery(itemLimit = 24): Promise<GalleryImage[]> {
  const docs = await listPublicDocs("gallery", { requirePublished: true });
  return sortByOrder(mapDocs<GalleryImage>(docs)).slice(0, itemLimit);
}

export async function getVideos(itemLimit = 12): Promise<VideoItem[]> {
  const docs = await listPublicDocs("videos", { requirePublished: true });
  return sortByOrder(mapDocs<VideoItem>(docs)).slice(0, itemLimit);
}

export async function getAchievements(): Promise<Achievement[]> {
  const docs = await listPublicDocs("achievements", { requirePublished: true });
  return sortByOrder(mapDocs<Achievement>(docs));
}

export async function getCompetitions(): Promise<Competition[]> {
  const docs = await listPublicDocs("competitions", { requirePublished: true });
  return sortByOrder(mapDocs<Competition>(docs));
}

export async function getArticles(itemLimit = 12): Promise<Article[]> {
  try {
    const tryArticles = async (db: Firestore) => {
      const snap = await getDocs(
        query(collection(db, "articles"), where("published", "==", true)),
      );
      return mapDocs<Article>(snap.docs)
        .filter((item) => (item as Article).visible !== false)
        .sort((a, b) =>
          String(b.publishDate || "").localeCompare(String(a.publishDate || "")),
        )
        .slice(0, itemLimit);
    };

    try {
      const publicDb = publicDbOrNull();
      if (publicDb) return await tryArticles(publicDb);
    } catch {
      // fall through
    }

    const serverDb = await getServerCmsDb();
    if (serverDb) return await tryArticles(serverDb);
    return [];
  } catch (err) {
    console.error("[cms] failed to read articles", err);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const trySlug = async (db: Firestore) => {
      const snap = await getDocs(
        query(
          collection(db, "articles"),
          where("slug", "==", slug),
          where("published", "==", true),
          limit(1),
        ),
      );
      if (snap.empty) return null;
      const d = snap.docs[0]!;
      const data = d.data() as Article;
      if (data.visible === false) return null;
      return { id: d.id, ...data };
    };

    try {
      const publicDb = publicDbOrNull();
      if (publicDb) return await trySlug(publicDb);
    } catch {
      // fall through
    }

    const serverDb = await getServerCmsDb();
    if (serverDb) return await trySlug(serverDb);
    return null;
  } catch (err) {
    console.error("[cms] failed to read article", slug, err);
    return null;
  }
}

export async function getSocialLinks(): Promise<SocialLinks | null> {
  return getSingleDoc<SocialLinks>("socialLinks/main");
}

export async function getSeo(pageId: string): Promise<SeoPage | null> {
  return getSingleDoc<SeoPage>(`seo/${pageId}`);
}
