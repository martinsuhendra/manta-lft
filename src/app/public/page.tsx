import { Suspense } from "react";

import { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

import { AboutSection } from "./_components/about-section";
import { LandingHero } from "./_components/landing-hero";
import { ShopPageDataSections } from "./_components/shop-page-data-sections";
import { ShopPageDataSkeleton } from "./_components/shop-page-skeleton";
import { TestimonialsSection } from "./_components/testimonials-section";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Join Our Community`,
  description: "Experience world-class CrossFit training, expert coaching, and a supportive community.",
};

export default function ShopPage() {
  return (
    <>
      <LandingHero />
      <AboutSection />
      <Suspense fallback={<ShopPageDataSkeleton />}>
        <ShopPageDataSections />
      </Suspense>
      <TestimonialsSection />
    </>
  );
}
