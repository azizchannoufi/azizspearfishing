export const assets = {
  hero: "/assets/hero.jpg",
  brandPortrait: "/assets/brand-portrait.png",
  journey: {
    training: "/assets/journey-1.jpg",
    competition: "/assets/journey-2.jpg",
    travel: "/assets/journey-3.jpg",
    hunt: "/assets/gallery-whatsapp.jpeg",
    podium: "/assets/gallery-capture.png",
  },
  gallery: [
    { src: "/assets/hero.jpg", title: "Deep Blue", year: "2026", label: "2026 COMPETITION" },
    { src: "/assets/journey-1.jpg", title: "Training Depths", year: "2025", label: "2025 TRAINING" },
    { src: "/assets/journey-2.jpg", title: "Competition Day", year: "2026", label: "2026 COMPETITION" },
    { src: "/assets/journey-3.jpg", title: "Open Water", year: "2025", label: "2025 EXPEDITION" },
    { src: "/assets/gallery-whatsapp.jpeg", title: "The Hunt", year: "2026", label: "2026 THE HUNT" },
    { src: "/assets/gallery-capture.png", title: "Surface Light", year: "2024", label: "2024 ARCHIVE" },
    { src: "/assets/brand-portrait.png", title: "Portrait", year: "2026", label: "2026 PORTRAIT" },
  ],
  video: {
    src: "/assets/videos/CEQE3431.MOV",
    poster: "/assets/journey-2.jpg",
  },
  sponsors: [
    {
      name: "Abysstar",
      logo: "/assets/sponsors/abysstar.png",
      role: "Official Equipment Partner",
      href: "#",
    },
  ],
  contactBg: "/assets/journey-1.jpg",
} as const;
