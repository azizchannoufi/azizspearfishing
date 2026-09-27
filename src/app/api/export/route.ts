import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, AuthError } from "@/lib/firebase/verify-admin";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const COLLECTIONS = [
  "sponsors",
  "achievements",
  "competitions",
  "gallery",
  "videos",
  "articles",
  "athleteStats",
] as const;

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);
    const db = getAdminDb();

    const [athlete, settings, social, homepageHero, homepageSections, seoHome] =
      await Promise.all([
        db.doc("athlete/profile").get(),
        db.doc("siteSettings/general").get(),
        db.doc("socialLinks/main").get(),
        db.doc("homepage/hero").get(),
        db.doc("homepage/sections").get(),
        db.doc("seo/home").get(),
      ]);

    const lists: Record<string, unknown[]> = {};
    for (const name of COLLECTIONS) {
      const snap = await db.collection(name).limit(500).get();
      lists[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      athlete: athlete.exists ? athlete.data() : null,
      siteSettings: settings.exists ? settings.data() : null,
      socialLinks: social.exists ? social.data() : null,
      homepage: {
        hero: homepageHero.exists ? homepageHero.data() : null,
        sections: homepageSections.exists ? homepageSections.data() : null,
      },
      seo: {
        home: seoHome.exists ? seoHome.data() : null,
      },
      ...lists,
    };

    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unable to export content." }, { status: 500 });
  }
}
