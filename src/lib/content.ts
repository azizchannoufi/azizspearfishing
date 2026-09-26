import { assets } from "./assets";

export const athlete = {
  name: "AZIZ",
  fullName: "Aziz",
  tagline: "ENTER THE BLUE",
  roles: ["PRO", "SPEARFISHER", "ATHLETE"] as const,
  headline: "MORE THAN A SPORT.",
  aboutTitle: "BENEATH THE SURFACE",
  about:
    "From the silence of the deep to the intensity of competition, Aziz lives between breath and pressure — chasing light, discipline, and the perfect dive.",
  cta: "DISCOVER MY JOURNEY",
  contactHeadline: "READY TO DIVE DEEPER?",
  contactCta: "CONTACT THE ATHLETE",
  email: "hello@azizspearfishing.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "TikTok", href: "https://tiktok.com" },
  ],
};

export const navLinks = [
  { label: "HOME", href: "#hero" },
  { label: "ABOUT", href: "#about" },
  { label: "CAREER", href: "#career" },
  { label: "GALLERY", href: "#gallery" },
  { label: "VIDEOS", href: "#videos" },
  { label: "SPONSORS", href: "#sponsors" },
  { label: "CONTACT", href: "#contact" },
] as const;

export const stats = [
  { value: 15, suffix: "+", label: "Competitions" },
  { value: 50, suffix: "+", label: "Dives Logged" },
  { value: 30, suffix: "M+", label: "Depth Reached" },
] as const;

export const journeyChapters = [
  {
    id: "training",
    title: "TRAINING",
    copy: "Breath. Focus. Repetition beneath the surface.",
    image: assets.journey.training,
  },
  {
    id: "competition",
    title: "COMPETITION",
    copy: "Pressure that sharpens instinct and precision.",
    image: assets.journey.competition,
  },
  {
    id: "travel",
    title: "TRAVEL",
    copy: "Coastlines, currents, and new hunting grounds.",
    image: assets.journey.travel,
  },
  {
    id: "hunt",
    title: "THE HUNT",
    copy: "Silence. Shadow. One decisive moment.",
    image: assets.journey.hunt,
  },
  {
    id: "podium",
    title: "THE PODIUM",
    copy: "Proof of the work done in the dark.",
    image: assets.journey.podium,
  },
] as const;

export const competitions = [
  {
    year: "2024",
    title: "Coastal Open",
    place: "3rd",
    location: "Mediterranean",
    image: assets.journey.travel,
    side: "left" as const,
  },
  {
    year: "2025",
    title: "Blue Depth Challenge",
    place: "2nd",
    location: "Atlantic",
    image: assets.journey.competition,
    side: "right" as const,
  },
  {
    year: "2026",
    title: "World Spearfishing Cup",
    place: "1st",
    location: "Red Sea",
    image: assets.hero,
    side: "left" as const,
  },
];

export const marqueeText = "SPONSORS  •  PARTNERS  •  SPONSORS  •  PARTNERS  •  ";
