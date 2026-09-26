"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PreloaderContextValue = {
  complete: boolean;
  setComplete: (v: boolean) => void;
};

const PreloaderContext = createContext<PreloaderContextValue>({
  complete: false,
  setComplete: () => {},
});

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const [complete, setCompleteState] = useState(false);

  const setComplete = useCallback((v: boolean) => {
    setCompleteState(v);
  }, []);

  useEffect(() => {
    if (complete) {
      document.documentElement.classList.add("preloader-done");
    }
  }, [complete]);

  const value = useMemo(
    () => ({ complete, setComplete }),
    [complete, setComplete],
  );

  return (
    <PreloaderContext.Provider value={value}>
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  return useContext(PreloaderContext);
}
