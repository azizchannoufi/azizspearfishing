import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { z } from "zod";

export const runtime = "nodejs";

const eventSchema = z.object({
  type: z.enum([
    "page_view",
    "visitor",
    "gallery_view",
    "video_click",
    "video_view",
    "article_view",
    "message",
  ]),
  page: z.string().max(120).optional(),
  contentId: z.string().max(120).optional(),
  sessionId: z.string().max(80).optional(),
  device: z.string().max(40).optional(),
  browser: z.string().max(40).optional(),
  referrer: z.string().max(500).optional(),
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const json = await request.json();
    const event = eventSchema.parse(json);
    const db = getAdminDb();
    const day = todayKey();
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      undefined;

    const batch = db.batch();
    const dailyRef = db.doc(`analyticsDaily/${day}`);

    const dailyUpdate: Record<string, FieldValue> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (event.type === "visitor") {
      dailyUpdate.visitors = FieldValue.increment(1);
    }
    if (event.type === "page_view") {
      dailyUpdate.pageViews = FieldValue.increment(1);
    }
    if (event.type === "gallery_view") {
      dailyUpdate.galleryViews = FieldValue.increment(1);
    }
    if (event.type === "video_click") {
      dailyUpdate.videoClicks = FieldValue.increment(1);
    }
    if (event.type === "message") {
      dailyUpdate.messages = FieldValue.increment(1);
    }

    batch.set(dailyRef, dailyUpdate, { merge: true });

    if (event.page) {
      const pageId = event.page.replace(/\//g, "_").replace(/^_/, "") || "home";
      batch.set(
        db.doc(`analyticsPages/${pageId}`),
        {
          path: event.page,
          views: FieldValue.increment(1),
          lastUpdated: FieldValue.serverTimestamp(),
          country: country || null,
          device: event.device || null,
          browser: event.browser || null,
          referrer: event.referrer || null,
        },
        { merge: true },
      );
    }

    if (event.contentId) {
      if (event.type === "gallery_view") {
        batch.set(
          db.doc(`analyticsGallery/${event.contentId}`),
          { views: FieldValue.increment(1) },
          { merge: true },
        );
      }
      if (event.type === "video_click" || event.type === "video_view") {
        const field = event.type === "video_click" ? "clicks" : "views";
        batch.set(
          db.doc(`analyticsVideos/${event.contentId}`),
          { [field]: FieldValue.increment(1) },
          { merge: true },
        );
      }
      if (event.type === "article_view") {
        batch.set(
          db.doc(`analyticsArticles/${event.contentId}`),
          { views: FieldValue.increment(1) },
          { merge: true },
        );
      }
    }

    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to record analytics." }, { status: 400 });
  }
}
