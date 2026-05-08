"use client";

import { useEffect, useMemo, useState } from "react";

import { NAV_ITEMS } from "./public-nav";

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
    }

    function handleHashChange() {
      setActiveHash(window.location.hash || "");
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    setActiveHash(window.location.hash || "");
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/public") return;
    if (!trackedSectionHashes.length) return;

    const sectionEntries = trackedSectionHashes
      .map((hash) => {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (!element) return null;
        return { hash, element };
      })
      .filter((entry): entry is { hash: string; element: HTMLElement } => Boolean(entry));

    if (!sectionEntries.length) return;

    const intersectionState = new Map<string, number>();
    sectionEntries.forEach((entry) => {
      intersectionState.set(entry.hash, 0);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const hash = `#${entry.target.id}`;
          if (!intersectionState.has(hash)) continue;
          intersectionState.set(hash, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        if (window.scrollY < 120) {
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

    for (const entry of sectionEntries) {
      observer.observe(entry.element);
    }

    return () => observer.disconnect();
  }, [pathname, trackedSectionHashes]);

  return { activeHash, isScrolled };
}
