import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/content/public";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { ArticleViewTracker } from "@/components/analytics/ArticleViewTracker";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article" };
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    openGraph: article.coverImage?.secureUrl
      ? { images: [{ url: article.coverImage.secureUrl }] }
      : undefined,
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-ocean-deep text-foam">
      <AnalyticsTracker page={`news_${slug}`} />
      <ArticleViewTracker articleId={article.id} />
      <article className="section-pad mx-auto max-w-3xl py-24">
        <Link href="/news" className="text-xs tracking-[0.2em] text-foam-muted hover:text-accent-teal">
          ← Journal
        </Link>
        <h1 className="mt-6 font-display text-5xl md:text-7xl">{article.title}</h1>
        <p className="mt-4 text-sm text-foam-muted">
          {article.author} · {article.publishDate}
        </p>
        {article.coverImage?.secureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage.secureUrl}
            alt=""
            className="mt-10 w-full object-cover"
          />
        )}
        <div
          className="prose prose-invert mt-10 max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </main>
  );
}
