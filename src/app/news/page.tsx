import Link from "next/link";
import type { Metadata } from "next";
import { getArticles, getSeo } from "@/lib/content/public";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo("home");
  return {
    title: "Journal — AZIZ",
    description: seo?.description || "News and stories from the water.",
  };
}

export default async function NewsIndexPage() {
  const articles = await getArticles(50);

  return (
    <main className="min-h-screen bg-ocean-deep text-foam">
      <AnalyticsTracker page="news" />
      <div className="section-pad mx-auto max-w-5xl py-24">
        <Link href="/" className="text-xs tracking-[0.2em] text-foam-muted hover:text-accent-teal">
          ← Home
        </Link>
        <h1 className="mt-6 font-display text-6xl md:text-8xl">Journal</h1>
        <div className="mt-12 space-y-8">
          {articles.map((a) => (
            <article key={a.id} className="border-b border-foam/10 pb-8">
              <Link href={`/news/${a.slug}`}>
                <h2 className="font-display text-3xl hover:text-accent-teal">{a.title}</h2>
                <p className="mt-2 text-foam-muted">{a.excerpt}</p>
                <p className="mt-2 text-xs text-foam-muted/70">{a.publishDate}</p>
              </Link>
            </article>
          ))}
          {articles.length === 0 && (
            <p className="text-foam-muted">No published articles yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
