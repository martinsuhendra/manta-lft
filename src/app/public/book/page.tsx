import { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";

import { SectionWithPattern } from "../_components/section-with-pattern";
import { getClasses } from "../_lib/shop-queries";

import { BookPageContent } from "./_components/book-page-content";

export const metadata: Metadata = {
  title: `Book a Class - ${APP_CONFIG.name}`,
  description: "Browse and book classes based on your membership",
};

interface BookPageProps {
  searchParams: Promise<{ item?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const initialItemId = typeof params.item === "string" ? params.item : undefined;
  const activeBrandId = await resolveActiveBrandIdFromCookie();
  const classes = await getClasses(activeBrandId ?? undefined);

  const hasInitialClass = initialItemId ? classes.some((item) => item.id === initialItemId) : false;

  return (
    <SectionWithPattern as="div" className="bg-muted/20 sporty-section-fill min-h-[60vh]">
      <BookPageContent classes={classes} initialItemId={hasInitialClass ? initialItemId : undefined} />
    </SectionWithPattern>
  );
}
