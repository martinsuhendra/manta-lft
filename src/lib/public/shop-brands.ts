import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/generated/prisma";

export const getActiveBrands = unstable_cache(
  async () =>
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, primaryColor: true, accentColor: true, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
  ["public-active-brands"],
  { revalidate: 300 },
);
