export interface PublicNavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: PublicNavItem[] = [
  { label: "Home", href: "/public" },
  { label: "Classes", href: "/public#classes" },
  { label: "Plans", href: "/public#plans" },
  { label: "Book", href: "/public/book" },
];

export function getPathFromHref(href: string) {
  const [path] = href.split("#");
  return path || "/public";
}

export function getHashFromHref(href: string) {
  const [, hash = ""] = href.split("#");
  return hash ? `#${hash}` : "";
}

export function waitForSectionAndScroll(hash: string, maxAttempts = 100) {
  const id = hash.replace("#", "");
  if (!id || typeof document === "undefined") return () => {};

  let attempts = 0;
  let frame = 0;
  let cancelled = false;

  function tryScroll() {
    if (cancelled) return;

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (attempts++ < maxAttempts) {
      frame = requestAnimationFrame(tryScroll);
    }
  }

  tryScroll();

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
}

function normalizePath(pathname: string) {
  const [withoutHash] = pathname.split("#");
  return withoutHash;
}

function normalizeHash(hash: string) {
  if (!hash) return "";
  return hash.startsWith("#") ? hash : `#${hash}`;
}

export function isNavItemActive(pathname: string, currentHash: string, href: string) {
  const normalizedPathname = normalizePath(pathname);
  const [hrefPath, hrefHash = ""] = href.split("#");
  const normalizedHrefPath = normalizePath(hrefPath);
  const normalizedCurrentHash = normalizeHash(currentHash);
  const normalizedHrefHash = normalizeHash(hrefHash);

  if (normalizedHrefHash)
    return normalizedPathname === normalizedHrefPath && normalizedCurrentHash === normalizedHrefHash;

  if (normalizedHrefPath === "/public") return normalizedPathname === "/public" && !normalizedCurrentHash;

  if (!normalizedHrefPath) return false;
  return normalizedPathname.startsWith(normalizedHrefPath);
}
