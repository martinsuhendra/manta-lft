import React from "react";

import { cookies } from "next/headers";
import Link from "next/link";

import { Clock, Facebook, Instagram, MapPin, Twitter } from "lucide-react";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { ShopBrandProviderWrapper } from "./_components/shop-brand-provider-wrapper";
import { ShopHeaderWrapper } from "./_components/shop-header-wrapper";

const footerExploreLinks = [
  { label: "Home", href: "/public" },
  { label: "Classes", href: "/public#classes" },
  { label: "Membership Plans", href: "/public#plans" },
  { label: "Upcoming Sessions", href: "/public#schedule" },
];

const footerTrainingLinks = [
  { label: "Book a Class", href: "/public/book" },
  { label: "Class Details", href: "/public#classes" },
  { label: "Community & Testimonials", href: "/public#plans" },
];

const footerSupportLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const cookieStore = await cookies();
  const cookieBrandId = cookieStore.get("active_brand_id")?.value;

  const activeBrands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, primaryColor: true, accentColor: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  let brands = activeBrands;
  if (session?.user.id && ![USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role)) {
    const membershipBrandRows = await prisma.membershipBrand.findMany({
      where: {
        membership: {
          userId: session.user.id,
          status: "ACTIVE",
          expiredAt: { gt: new Date() },
        },
      },
      distinct: ["brandId"],
      select: { brandId: true },
    });
    const membershipBrandIds = membershipBrandRows.map((row) => row.brandId);
    brands = membershipBrandIds.length
      ? activeBrands.filter((brand) => membershipBrandIds.includes(brand.id))
      : activeBrands;
  }

  const firstAccessibleBrandId = brands[0]?.id;
  const initialActiveBrandId =
    cookieBrandId && brands.some((brand) => brand.id === cookieBrandId) ? cookieBrandId : firstAccessibleBrandId;

  return (
    <ShopBrandProviderWrapper initialActiveBrandId={initialActiveBrandId} initialBrands={brands}>
      <div className="bg-background flex min-h-screen flex-col">
        <ShopHeaderWrapper session={session} />
        <main className="flex min-h-0 flex-1 flex-col pt-20">{children}</main>
        <div className="h-10 bg-white sm:h-14 md:h-20" aria-hidden />
        <footer className="bg-brand-accent relative pt-10 pb-6 sm:pt-14 sm:pb-8">
          <div
            className="text-brand-accent pointer-events-none absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] leading-none"
            aria-hidden
          >
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-10 w-full sm:h-14 md:h-20">
              <path
                fill="currentColor"
                fillOpacity="0.35"
                d="M0,72L60,66.7C120,61,240,51,360,58.7C480,67,600,93,720,90.7C840,88,960,56,1080,48C1200,40,1320,56,1380,64L1440,72L1440,120L0,120Z"
              />
              <path
                fill="currentColor"
                d="M0,88L48,82.7C96,77,192,67,288,69.3C384,72,480,88,576,90.7C672,93,768,83,864,74.7C960,67,1056,61,1152,64C1248,67,1344,88,1392,98.7L1440,109L1440,120L0,120Z"
              />
            </svg>
          </div>
          <div className="container mx-auto px-4">
            <div className="mb-8 grid grid-cols-1 gap-8 sm:mb-10 lg:grid-cols-5 lg:gap-10">
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded font-bold text-white">
                    {APP_CONFIG.name.charAt(0)}
                  </div>
                  <span className="text-xl font-black tracking-tight text-white">{APP_CONFIG.name}</span>
                </div>
                <p className="mb-5 max-w-md text-sm text-white/75">
                  Performance-first fitness community with guided classes, structured progression, and a booking flow
                  that keeps your training consistent.
                </p>
                <div className="mb-6 flex gap-4">
                  <a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href="/public/book"
                    className="bg-brand-primary hover:bg-brand-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition-colors"
                  >
                    Book Your Class
                  </Link>
                  <Link
                    href="/public#plans"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    View Memberships
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">Explore</h4>
                <ul className="space-y-2.5 text-sm text-white/70">
                  {footerExploreLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-brand-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">Training</h4>
                <ul className="space-y-2.5 text-sm text-white/70">
                  {footerTrainingLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-brand-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">Account & Support</h4>
                <ul className="space-y-2.5 text-sm text-white/70">
                  <li>
                    <Link
                      href={session ? "/public/my-account" : "/sign-in"}
                      className="hover:text-brand-primary transition-colors"
                    >
                      {session ? "My Account" : "Sign In"}
                    </Link>
                  </li>
                  {footerSupportLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="hover:text-brand-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">Visit Us</h4>
                <ul className="space-y-2.5 text-sm text-white/70">
                  <li className="flex items-start gap-3">
                    <MapPin className="text-brand-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>CrossFit box location available at reception</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="text-brand-primary h-4 w-4 shrink-0" />
                    <span>
                      Mon–Fri: 5am – 9pm
                      <br />
                      Sat–Sun: 7am – 4pm
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row">
              <p>{APP_CONFIG.copyright}</p>
              <div className="flex gap-6 text-[11px] tracking-wide uppercase">
                <span>Built for members and coaches</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ShopBrandProviderWrapper>
  );
}
