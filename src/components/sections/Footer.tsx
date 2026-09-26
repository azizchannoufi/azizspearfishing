import { athlete } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ocean-deep py-10">
      <div className="section-pad mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p className="font-display text-lg tracking-[0.2em] text-foam">
          {athlete.name}
        </p>
        <p className="text-[11px] tracking-[0.2em] text-foam-muted">
          © {new Date().getFullYear()} — PRO SPEARFISHER ATHLETE
        </p>
      </div>
    </footer>
  );
}
