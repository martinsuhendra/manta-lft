import { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";

import { AboutSection } from "./_components/about-section";
import { ClassesSection } from "./_components/classes-section";
import { FacilitiesSection } from "./_components/facilities-section";
import { InstructorsSection } from "./_components/instructors-section";
import { LandingHero } from "./_components/landing-hero";
import { MembershipPlans } from "./_components/membership-plans";
import { TestimonialsSection } from "./_components/testimonials-section";
import { UpcomingSessions } from "./_components/upcoming-sessions";
import { getShopPageData } from "./_lib/shop-queries";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Join Our Community`,
  description: "Experience world-class CrossFit training, expert coaching, and a supportive community.",
};

export default async function ShopPage() {
  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const { products, sessions, classes, instructors } = await getShopPageData(activeBrandId ?? undefined);

  return (
    <>
      <LandingHero />
      <AboutSection />
      <ClassesSection classes={classes} />
      <UpcomingSessions sessions={sessions} programNames={classes.map((c) => c.name)} />
      <FacilitiesSection />
      <InstructorsSection instructors={instructors} />
      <MembershipPlans products={products} />
      <TestimonialsSection />
    </>
  );
}
