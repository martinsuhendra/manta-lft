import React from "react";

import { cookies } from "next/headers";

import { Clock, Facebook, Instagram, MapPin, Twitter } from "lucide-react";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { ShopBrandProviderWrapper } from "./_components/shop-brand-provider-wrapper";
import { ShopHeaderWrapper } from "./_components/shop-header-wrapper";

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
        <footer className="border-border bg-card border-t pt-10 pb-6 sm:pt-16 sm:pb-8">
          <div className="container mx-auto px-4">
            <div className="mb-8 grid grid-cols-1 gap-8 sm:mb-12 sm:gap-12 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="mb-6 flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded font-bold">
                    {APP_CONFIG.name.charAt(0)}
                  </div>
                  <span className="text-foreground text-xl font-black tracking-tight">{APP_CONFIG.name}</span>
                </div>
                <p className="text-muted-foreground mb-6 max-w-xs text-sm">
                  Pushing the boundaries of human performance through functional fitness and high-intensity training.
                </p>
                <div className="flex gap-4">
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
              </div>
              <div>
                <h4 className="text-foreground mb-6 font-bold tracking-widest uppercase">Programs</h4>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li>
                    <a href="#classes" className="hover:text-primary transition-colors">
                      Our Classes
                    </a>
                  </li>
                  <li>
                    <a href="/public/schedule" className="hover:text-primary transition-colors">
                      Schedule
                    </a>
                  </li>
                  <li>
                    <a href="#plans" className="hover:text-primary transition-colors">
                      Memberships
                    </a>
                  </li>
                  <li>
                    <a href="/public/book" className="hover:text-primary transition-colors">
                      Book a Class
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-6 font-bold tracking-widest uppercase">Contact</h4>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                    <span>Visit us at the box</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="text-primary h-5 w-5 shrink-0" />
                    <span>
                      Mon–Fri: 5am – 9pm
                      <br />
                      Sat–Sun: 7am – 4pm
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-border text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs md:flex-row">
              <p>{APP_CONFIG.copyright}</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ShopBrandProviderWrapper>
  );
}
