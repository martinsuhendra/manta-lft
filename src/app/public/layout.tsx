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
        <footer className="border-border bg-card border-t pt-10 pb-6 sm:pt-14 sm:pb-8">
          <div className="container mx-auto px-4">
            <div className="mb-8 grid grid-cols-1 gap-8 sm:mb-10 lg:grid-cols-5 lg:gap-10">
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded font-bold">
                    {APP_CONFIG.name.charAt(0)}
                  </div>
                  <span className="text-foreground text-xl font-black tracking-tight">{APP_CONFIG.name}</span>
                </div>
                <p className="text-muted-foreground mb-5 max-w-md text-sm">
                  Performance-first fitness community with guided classes, structured progression, and a booking flow
                  that keeps your training consistent.
                </p>
                <div className="mb-6 flex gap-4">
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href="/public/book"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors"
                  >
                    Book Your Class
                  </Link>
                  <Link
                    href="/public#plans"
                    className="border-border hover:bg-muted text-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
                  >
                    View Memberships
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-foreground mb-4 text-sm font-bold tracking-widest uppercase">Explore</h4>
                <ul className="text-muted-foreground space-y-2.5 text-sm">
                  {footerExploreLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-4 text-sm font-bold tracking-widest uppercase">Training</h4>
                <ul className="text-muted-foreground space-y-2.5 text-sm">
                  {footerTrainingLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-4 text-sm font-bold tracking-widest uppercase">Account & Support</h4>
                <ul className="text-muted-foreground space-y-2.5 text-sm">
                  <li>
                    <Link
                      href={session ? "/public/my-account" : "/sign-in"}
                      className="hover:text-primary transition-colors"
                    >
                      {session ? "My Account" : "Sign In"}
                    </Link>
                  </li>
                  {footerSupportLinks.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-4 text-sm font-bold tracking-widest uppercase">Visit Us</h4>
                <ul className="text-muted-foreground space-y-2.5 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>CrossFit box location available at reception</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="text-primary h-4 w-4 shrink-0" />
                    <span>
                      Mon–Fri: 5am – 9pm
                      <br />
                      Sat–Sun: 7am – 4pm
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs md:flex-row">
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
