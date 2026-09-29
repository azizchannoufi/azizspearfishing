import { Preloader } from "@/components/preloader/Preloader";
import { Navigation } from "@/components/navigation/Navigation";
import { Hero } from "@/components/hero/Hero";
import { AboutSection } from "@/components/sections/AboutSection";
import { StatsSection } from "@/components/sections/StatsSection";
import { JourneySection } from "@/components/sections/JourneySection";
import { TimelineSection } from "@/components/sections/TimelineSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { VideoSection } from "@/components/sections/VideoSection";
import { SponsorsSection } from "@/components/sections/SponsorsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/sections/Footer";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { CmsHome } from "@/components/home/CmsHome";
import { loadHomeCms } from "@/lib/content/load-home";
import type { Metadata } from "next";
import { getSeo, getSiteSettings } from "@/lib/content/public";

/** Refresh CMS content (including social stats) without a full redeploy. */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeo("home"), getSiteSettings()]);
  return {
    title: seo?.title || settings?.websiteName || "AZIZ — Pro Spearfisher Athlete",
    description:
      seo?.description ||
      "Interactive underwater documentary portfolio of Aziz — pro spearfisher athlete.",
    openGraph: seo?.ogImage?.secureUrl
      ? { images: [{ url: seo.ogImage.secureUrl }] }
      : undefined,
  };
}

export default async function Home() {
  const cms = await loadHomeCms();

  if (cms.maintenanceMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ocean-deep px-6 text-center">
        <div>
          <h1 className="font-display text-4xl text-foam md:text-6xl">
            Website temporarily unavailable.
          </h1>
          <p className="mt-4 text-foam-muted">We&apos;ll be back soon.</p>
        </div>
      </main>
    );
  }

  if (cms.configured) {
    return (
      <>
        <AnalyticsTracker page="home" />
        <CmsHome data={cms} />
      </>
    );
  }

  return (
    <main className="relative">
      <AnalyticsTracker page="home" />
      <Preloader />
      <Navigation />
      <Hero />
      <AboutSection />
      <StatsSection />
      <JourneySection />
      <TimelineSection />
      <GallerySection />
      <VideoSection />
      <SponsorsSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
