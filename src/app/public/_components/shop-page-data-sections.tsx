import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";

import { getShopPageData } from "../_lib/shop-queries";

import { ClassesSection } from "./classes-section";
import { FacilitiesSection } from "./facilities-section";
import { InstructorsSection } from "./instructors-section";
import { MembershipPlans } from "./membership-plans";
import { UpcomingSessions } from "./upcoming-sessions";

export async function ShopPageDataSections() {
  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const { products, sessions, classes, instructors } = await getShopPageData(activeBrandId ?? undefined);

  return (
    <>
      <ClassesSection classes={classes} />
      <UpcomingSessions sessions={sessions} programNames={classes.map((c) => c.name)} />
      <FacilitiesSection />
      <InstructorsSection instructors={instructors} />
      <MembershipPlans products={products} />
    </>
  );
}
