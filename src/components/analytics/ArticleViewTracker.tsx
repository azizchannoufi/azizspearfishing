"use client";

import { useEffect } from "react";
import { trackEvent } from "./AnalyticsTracker";

export function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    void trackEvent({ type: "article_view", page: "news", contentId: articleId });
  }, [articleId]);
  return null;
}
