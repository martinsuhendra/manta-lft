"use client";

import type { ComponentProps } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getHashFromHref, getPathFromHref } from "./public-nav";

type PublicHashLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function PublicHashLink({ href, onClick, ...props }: PublicHashLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const targetPath = getPathFromHref(href);
  const hash = getHashFromHref(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !hash) return;

        const normalizedTargetPath = targetPath || "/public";

        if (pathname === normalizedTargetPath) {
          event.preventDefault();
          window.history.pushState(null, "", `${normalizedTargetPath}${hash}`);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
          return;
        }

        event.preventDefault();
        router.push(`${normalizedTargetPath}${hash}`);
      }}
      {...props}
    />
  );
}
