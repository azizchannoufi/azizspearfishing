"use client";

import { type ReactNode } from "react";
import { ReducedMotionProvider } from "./ReducedMotionProvider";
import { LenisProvider } from "./LenisProvider";
import { PreloaderProvider } from "./PreloaderProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReducedMotionProvider>
      <PreloaderProvider>
        <LenisProvider>{children}</LenisProvider>
      </PreloaderProvider>
    </ReducedMotionProvider>
  );
}
