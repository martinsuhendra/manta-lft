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
