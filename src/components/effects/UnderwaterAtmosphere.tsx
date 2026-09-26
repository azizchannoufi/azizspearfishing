"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { isDesktopCapable } from "@/lib/motion";
import { useEffect, useState } from "react";

const WebGLParticles = dynamic(
  () =>
    import("@/components/effects/WebGLParticles").then((m) => m.WebGLParticles),
  { ssr: false },
);

export function UnderwaterAtmosphere() {
  const { reducedMotion } = useReducedMotion();
  const [useWebGL, setUseWebGL] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          if (isDesktopCapable()) setUseWebGL(true);
        })
      : window.setTimeout(() => {
          if (isDesktopCapable()) setUseWebGL(true);
        }, 900);

    return () => {
      if (typeof idle === "number") window.clearTimeout(idle);
      else window.cancelIdleCallback?.(idle as number);
    };
  }, [reducedMotion]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[1] grain" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,11,20,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-screen">
        <div className="absolute -top-1/4 left-1/4 h-[80%] w-px rotate-12 bg-gradient-to-b from-transparent via-accent-teal/40 to-transparent blur-[1px]" />
        <div className="absolute top-0 right-1/3 h-full w-px -rotate-6 bg-gradient-to-b from-transparent via-foam/25 to-transparent blur-[2px]" />
      </div>
      {useWebGL ? (
        <div className="pointer-events-none absolute inset-0 z-[1] opacity-70">
          <WebGLParticles />
        </div>
      ) : (
        <CssBubbles />
      )}
    </>
  );
}

function CssBubbles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute bottom-[-10%] rounded-full bg-foam/25"
          style={{
            left: `${8 + ((i * 17) % 84)}%`,
            width: 2 + (i % 4),
            height: 2 + (i % 4),
            animation: `bubble-rise ${10 + (i % 7)}s linear ${i * 0.7}s infinite`,
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
}
