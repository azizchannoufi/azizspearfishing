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

export default function Home() {
  return (
    <main className="relative">
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
