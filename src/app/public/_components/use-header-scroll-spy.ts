"use client";

import { useEffect, useMemo, useState } from "react";

import { NAV_ITEMS, waitForSectionAndScroll } from "./public-nav";

interface UseHeaderScrollSpyParams {
  pathname: string;
}

export function useHeaderScrollSpy({ pathname }: UseHeaderScrollSpyParams) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  const trackedSectionHashes = useMemo(
    () =>
      NAV_ITEMS.map((item) => item.href.split("#")[1])
        .filter((hash): hash is string => Boolean(hash))
        .map((hash) => `#${hash}`),
    [],
  );

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
        waitForSectionAndScroll(hash);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash || "";
    setActiveHash(hash);
    if (pathname !== "/public" || !hash) return;

    return waitForSectionAndScroll(hash);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/public") return;
    if (!trackedSectionHashes.length) return;

    const trackedIds = trackedSectionHashes.map((hash) => hash.replace("#", ""));
    const intersectionState = new Map<string, number>();
    const observedElements = new Map<string, HTMLElement>();

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

    syncObservedSections();

    // Sections rendered inside Suspense boundaries stream in after this effect
    // runs, and hydration can replace the streamed DOM nodes, so keep watching
    // the DOM and re-observe whenever a tracked section's element changes.
    const mutationObserver = new MutationObserver(syncObservedSections);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, trackedSectionHashes]);

  return { activeHash, isScrolled };
}
