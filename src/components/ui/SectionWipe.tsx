"use client";

export function SectionWipe() {
  return (
    <div
      id="section-wipe"
      data-active="false"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9000] bg-ocean-mid transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[active=false]:translate-y-full data-[active=true]:translate-y-0"
    />
  );
}
