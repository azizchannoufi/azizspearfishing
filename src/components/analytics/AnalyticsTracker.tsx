"use client";

import { useEffect } from "react";

const SESSION_KEY = "aziz_vid";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice() {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

export async function trackEvent(payload: {
  type:
    | "page_view"
    | "visitor"
    | "gallery_view"
    | "video_click"
    | "video_view"
    | "article_view"
    | "message";
  page?: string;
  contentId?: string;
}) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
        device: detectDevice(),
        browser: detectBrowser(),
        referrer: document.referrer || undefined,
      }),
    });
  } catch {
    // ignore
  }
}

export function AnalyticsTracker({ page = "home" }: { page?: string }) {
  useEffect(() => {
    const visitKey = `aziz_visit_${new Date().toISOString().slice(0, 10)}`;
    const isNewVisit = !sessionStorage.getItem(visitKey);
    if (isNewVisit) {
      sessionStorage.setItem(visitKey, "1");
      void trackEvent({ type: "visitor", page });
    }
    void trackEvent({ type: "page_view", page });
  }, [page]);

  return null;
}
