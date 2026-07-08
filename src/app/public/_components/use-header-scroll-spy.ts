"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NAV_ITEMS, waitForSectionAndScroll } from "./public-nav";

interface UseHeaderScrollSpyParams {
  pathname: string;
}

export function useHeaderScrollSpy({ pathname }: UseHeaderScrollSpyParams) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const cancelScrollRef = useRef<(() => void) | null>(null);

  const trackedSectionHashes = useMemo(
    () =>
      NAV_ITEMS.map((item) => item.href.split("#")[1])
        .filter((hash): hash is string => Boolean(hash))
        .map((hash) => `#${hash}`),
    [],
  );

  const scrollToHash = useCallback((hash: string) => {
    cancelScrollRef.current?.();
    cancelScrollRef.current = waitForSectionAndScroll(hash);
  }, []);

  const cancelPendingScroll = useCallback(() => {
    cancelScrollRef.current?.();
    cancelScrollRef.current = null;
  }, []);

  useEffect(() => {
    setActiveHash(window.location.hash || "");

    function handleScroll() {
      setIsScrolled(window.scrollY > 10);
      if (window.scrollY < 120 && !window.location.hash) {
        setActiveHash("");
      }
    }

    function handleHashChange() {
      const hash = window.location.hash || "";
      setActiveHash(hash);
      if (window.location.pathname === "/public" && hash) {
        scrollToHash(hash);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
      cancelPendingScroll();
    };
  }, [cancelPendingScroll, scrollToHash]);

  useEffect(() => {
    const hash = window.location.hash || "";
    setActiveHash(hash);

    if (pathname !== "/public" || !hash) {
      cancelPendingScroll();
      return;
    }

    scrollToHash(hash);
    return cancelPendingScroll;
  }, [cancelPendingScroll, pathname, scrollToHash]);

  useEffect(() => {
    if (pathname !== "/public") return;
    if (!trackedSectionHashes.length) return;

    const trackedIds = trackedSectionHashes.map((hash) => hash.replace("#", ""));
    const intersectionState = new Map<string, number>();
    const observedElements = new Map<string, HTMLElement>();
    let pollFrame = 0;
    let pollAttempts = 0;
    let pollingCancelled = false;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const hash = `#${entry.target.id}`;
          if (!intersectionState.has(hash)) continue;
          intersectionState.set(hash, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        if (window.scrollY < 120 && !window.location.hash) {
          setActiveHash("");
          return;
        }

        const ranked = [...intersectionState.entries()].filter(([, ratio]) => ratio > 0).sort((a, b) => b[1] - a[1]);
        if (!ranked.length) return;

        setActiveHash(ranked[0][0]);
      },
      {
        root: null,
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.15, 0.3, 0.5, 0.75, 1],
      },
    );

    function syncObservedSections() {
      for (const id of trackedIds) {
        const element = document.getElementById(id);
        const observed = observedElements.get(id);
        if (element === observed) continue;

        if (observed) intersectionObserver.unobserve(observed);
        if (!element) {
          observedElements.delete(id);
          intersectionState.set(`#${id}`, 0);
          continue;
        }

        observedElements.set(id, element);
        intersectionState.set(`#${id}`, 0);
        intersectionObserver.observe(element);
      }
    }

    function pollForSections() {
      if (pollingCancelled) return;

      syncObservedSections();

      const allSectionsFound = trackedIds.every((id) => observedElements.has(id));
      if (allSectionsFound || pollAttempts++ >= 120) return;

      pollFrame = requestAnimationFrame(pollForSections);
    }

    syncObservedSections();
    pollForSections();

    return () => {
      pollingCancelled = true;
      cancelAnimationFrame(pollFrame);
      intersectionObserver.disconnect();
    };
  }, [pathname, trackedSectionHashes]);

  return { activeHash, isScrolled };
}
