import { resolveAssetUrl } from "@/lib/cloudinary-asset";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";
import type { BrandSummary } from "@/stores/brand/brand-store";

export async function getAccessibleBrandSummariesForUser(params: {
  userId: string;
  role: string;
}): Promise<BrandSummary[]> {
  const { userId, role } = params;

  if ([USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(role)) {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        logoAsset: true,
        primaryColor: true,
        accentColor: true,
        isActive: true,
      },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: resolveAssetUrl(brand.logoAsset, brand.logo),
      primaryColor: brand.primaryColor,
      accentColor: brand.accentColor,
      isActive: brand.isActive,
    }));
  }

  const membershipBrandRows = await prisma.membershipBrand.findMany({
    where: {
      membership: {
        userId,
        status: "ACTIVE",
        expiredAt: { gt: new Date() },
      },
    },
    distinct: ["brandId"],
    select: { brandId: true },
  });
  const accessibleBrandIds = membershipBrandRows.map((row) => row.brandId);

  const brands = await prisma.brand.findMany({
    where: {
      isActive: true,
      ...(accessibleBrandIds.length ? { id: { in: accessibleBrandIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      logoAsset: true,
      primaryColor: true,
      accentColor: true,
      isActive: true,
    },
  });

  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: resolveAssetUrl(b.logoAsset, b.logo),
    primaryColor: b.primaryColor,
    accentColor: b.accentColor,
    isActive: b.isActive,
  }));
}
