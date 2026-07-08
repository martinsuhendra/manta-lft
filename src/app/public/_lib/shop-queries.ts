import { addDays, startOfDay } from "date-fns";

import { prisma } from "@/lib/generated/prisma";
import { serializePublicProduct } from "@/lib/product-serializer";
import { mapSessionWithCapacity } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

export async function getClasses(brandId?: string) {
  try {
    const classes = await prisma.item.findMany({
      where: {
        isActive: true,
        isPublic: true,
        ...(brandId ? { itemBrands: { some: { brandId } } } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        color: true,
        image: true,
        isActive: true,
        isPublic: true,
      },
    });
    return classes.filter((c) => c.isActive && c.isPublic);
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return [];
  }
}

export async function getActiveProducts(brandId?: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isPublic: true,
        ...(brandId ? { productBrands: { some: { brandId } } } : {}),
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        salePrice: true,
        discountStartsAt: true,
        discountEndsAt: true,
        validDays: true,
        participantsPerPurchase: true,
        image: true,
        imageAsset: true,
        paymentUrl: true,
        whatIsIncluded: true,
        features: true,
        createdAt: true,
        isPurchaseUnlimited: true,
        purchaseLimitPerUser: true,
        isActive: true,
        isPublic: true,
        position: true,
        updatedAt: true,
        productBrands: {
          select: { brandId: true, brand: { select: { id: true, name: true } } },
        },
      },
    });
    return products.map((product) => serializePublicProduct(product));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getUpcomingSessions(brandId?: string) {
  try {
    /** Landing `#schedule` uses `todayOnly` — fetch all of today only (avoid week window + limit hiding rows). */
    const dayStart = startOfDay(new Date());
    const dayEnd = addDays(dayStart, 1);

    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: "SCHEDULED",
        item: {
          isActive: true,
          isPublic: true,
        },
        ...(brandId ? { brandId } : {}),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, participantCount: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return sessions.map(mapSessionWithCapacity);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return [];
  }
}

export async function getInstructors(brandId?: string) {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: USER_ROLES.TEACHER,
        ...(brandId
          ? {
              teacherItems: {
                some: {
                  item: { itemBrands: { some: { brandId } } },
                  isActive: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 4,
    });
    return users.map((user) => ({ ...user, image: null, description: null }));
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    return [];
  }
}

export async function getShopPageData(brandId?: string) {
  const [products, sessions, classes, instructors] = await Promise.all([
    getActiveProducts(brandId),
    getUpcomingSessions(brandId),
    getClasses(brandId),
    getInstructors(brandId),
  ]);
  return { products, sessions, classes, instructors };
}
