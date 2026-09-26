import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { SectionWipe } from "@/components/ui/SectionWipe";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "AZIZ — Pro Spearfisher Athlete",
  description:
    "Interactive underwater documentary portfolio of Aziz — pro spearfisher athlete.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ocean-deep font-[family-name:var(--font-body)] text-foam">
        <AppProviders>
          <CustomCursor />
          <ScrollProgress />
          <SectionWipe />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
