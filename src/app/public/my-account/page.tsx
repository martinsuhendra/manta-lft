import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { canMemberCancel, getBookingSettings, getCancelDeadline, getSessionStartAt } from "@/lib/booking-settings";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { prisma } from "@/lib/generated/prisma";
import { getMembershipRemainingQuota } from "@/lib/quota-utils";

import { MyAccountContent } from "./_components/my-account-content";

export const metadata: Metadata = {
  title: `My Account - ${APP_CONFIG.name}`,
  description: "View your account details, membership, and purchase history",
};

async function getAccountData() {
  try {
    const session = await auth();

    if (!session?.user.id) {
      redirect("/public");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBrandId = await resolveActiveBrandIdFromCookie();
    if (!activeBrandId) {
      redirect("/public");
    }

    // Get user with memberships, transactions, and upcoming bookings
    const user = (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        emergencyContact: true,
        birthday: true,
        role: true,
        createdAt: true,
        memberships: {
          where: { membershipBrands: { some: { brandId: activeBrandId } } },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                validDays: true,
                productItems: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    quotaType: true,
                    quotaValue: true,
                    quotaPoolId: true,
                    quotaPool: { select: { totalQuota: true } },
                  },
                },
              },
            },
            quotaUsage: true,
            transaction: {
              select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                paidAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          where: { brandId: activeBrandId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                isPurchaseUnlimited: true,
                purchaseLimitPerUser: true,
              } as Record<string, boolean>,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        bookings: {
          where: {
            brandId: activeBrandId,
            status: { not: "CANCELLED" },
            classSession: {
              date: { gte: today },
              status: "SCHEDULED",
            },
          },
          include: {
            classSession: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                item: {
                  select: { id: true, name: true },
                },
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            membership: {
              select: {
                id: true,
                product: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    })) as any;

    if (!user) {
      redirect("/public");
    }

    // Format the response
    const now = new Date();
    const activeMemberships = user.memberships.filter(
      (m: MembershipWithQuota) => m.status === "ACTIVE" && new Date(m.expiredAt) > now,
    );
    const frozenMemberships = user.memberships.filter(
      (m: MembershipWithQuota) => m.status === "FREEZED" && new Date(m.expiredAt) > now,
    );

    const freezeRequests = await prisma.membershipFreezeRequest.findMany({
      where: { requestedById: user.id, membership: { membershipBrands: { some: { brandId: activeBrandId } } } },
      include: {
        membership: {
          select: {
            id: true,
            status: true,
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    type MembershipWithQuota = (typeof user)["memberships"][number];
    const countableTransactionStatuses = new Set(["PENDING", "PROCESSING", "COMPLETED"]);
    const purchaseCountByProductId = user.transactions.reduce((acc: Record<string, number>, transaction: any) => {
      if (!countableTransactionStatuses.has(transaction.status)) return acc;
      const next = acc[transaction.productId] ?? 0;
      acc[transaction.productId] = next + 1;
      return acc;
    }, {});

    const formatMembership = (m: MembershipWithQuota) => ({
      id: m.id,
      status: m.status,
      joinDate: m.joinDate.toISOString(),
      expiredAt: m.expiredAt.toISOString(),
      remainingQuota: getMembershipRemainingQuota(m),
      product: {
        id: m.product.id,
        name: m.product.name,
        price: Number(m.product.price),
        validDays: m.product.validDays,
      },
      transaction: m.transaction
        ? {
            id: m.transaction.id,
            status: m.transaction.status,
            amount: Number(m.transaction.amount),
            currency: m.transaction.currency,
            paidAt: m.transaction.paidAt?.toISOString() || null,
            createdAt: m.transaction.createdAt.toISOString(),
          }
        : null,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        emergencyContact: user.emergencyContact,
        birthday: user.birthday ? user.birthday.toISOString() : null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      activeMemberships: activeMemberships.map(formatMembership),
      frozenMemberships: frozenMemberships.map(formatMembership),
      freezeRequests: freezeRequests.map((fr) => ({
        id: fr.id,
        membershipId: fr.membershipId,
        reason: fr.reason,
        reasonDetails: fr.reasonDetails,
        status: fr.status,
        freezeStartDate: fr.freezeStartDate?.toISOString() ?? null,
        freezeEndDate: fr.freezeEndDate?.toISOString() ?? null,
        createdAt: fr.createdAt.toISOString(),
        membership: fr.membership,
      })),
      allMemberships: user.memberships.map((m: MembershipWithQuota) => ({
        id: m.id,
        status: m.status,
        joinDate: m.joinDate.toISOString(),
        expiredAt: m.expiredAt.toISOString(),
        product: {
          id: m.product.id,
          name: m.product.name,
          price: Number(m.product.price),
          validDays: m.product.validDays,
        },
        transaction: m.transaction
          ? {
              id: m.transaction.id,
              status: m.transaction.status,
              amount: Number(m.transaction.amount),
              currency: m.transaction.currency,
              paidAt: m.transaction.paidAt?.toISOString() || null,
              createdAt: m.transaction.createdAt.toISOString(),
            }
          : null,
      })),
      purchaseHistory: user.transactions.map((t: any) => {
        const productWithPurchaseLimit: {
          id: string;
          name: string;
          price: number;
          isPurchaseUnlimited?: boolean;
          purchaseLimitPerUser?: number | null;
        } = t.product;
        const isPurchaseUnlimited = productWithPurchaseLimit.isPurchaseUnlimited ?? true;
        return {
          id: t.id,
          status: t.status,
          amount: Number(t.amount),
          currency: t.currency,
          paymentMethod: t.paymentMethod,
          paymentProvider: t.paymentProvider,
          paidAt: t.paidAt?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
          product: {
            id: t.product.id,
            name: t.product.name,
            price: Number(t.product.price),
            isPurchaseUnlimited,
            purchaseLimitPerUser: productWithPurchaseLimit.purchaseLimitPerUser ?? null,
          },
          timesBought: isPurchaseUnlimited ? null : (purchaseCountByProductId[t.product.id] ?? 0),
        };
      }),
      upcomingBookings: await (async () => {
        const settings = await getBookingSettings(activeBrandId);
        return [...user.bookings]
          .sort((a, b) => a.classSession.date.getTime() - b.classSession.date.getTime())
          .map((b) => {
            const sessionStartAt = getSessionStartAt({
              date: b.classSession.date,
              startTime: b.classSession.startTime,
            });
            const canCancel = canMemberCancel(sessionStartAt, settings.cancellationDeadlineHours);
            const cancelDeadline = getCancelDeadline(sessionStartAt, settings.cancellationDeadlineHours);
            return {
              id: b.id,
              canCancel,
              cancelDeadline: cancelDeadline.toISOString(),
              classSession: {
                id: b.classSession.id,
                date: b.classSession.date.toISOString().split("T")[0],
                startTime: b.classSession.startTime,
                endTime: b.classSession.endTime,
                item: b.classSession.item,
                teacher: b.classSession.teacher,
              },
              membership: {
                id: b.membership.id,
                product: b.membership.product,
              },
            };
          });
      })(),
    };
  } catch (error) {
    console.error("Failed to fetch account data:", error);
    redirect("/public");
  }
}

export default async function MyAccountPage() {
  const accountData = await getAccountData();

  return <MyAccountContent accountData={accountData} />;
}
