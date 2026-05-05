import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { USER_ROLES } from "@/lib/types";

import { SectionWithPattern } from "../_components/section-with-pattern";
import { getClasses } from "../_lib/shop-queries";

import { BookPageContent } from "./_components/book-page-content";

export const metadata: Metadata = {
  title: `Book a Class - ${APP_CONFIG.name}`,
  description: "Browse and book classes based on your membership",
};

export default async function BookPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/public");
  }

  if (session.user.role !== USER_ROLES.MEMBER) {
    redirect("/public");
  }

  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const classes = await getClasses(activeBrandId ?? undefined);
  return (
    <SectionWithPattern as="div" className="bg-muted/20 sporty-section-fill min-h-[60vh]">
      <BookPageContent classes={classes} />
    </SectionWithPattern>
  );
}
