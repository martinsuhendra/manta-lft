import { canMemberCancel, getBookingSettings, getCancelDeadline, getSessionStartAt } from "@/lib/booking-settings";
import { prisma } from "@/lib/generated/prisma";
import { getMembershipRemainingQuota } from "@/lib/quota-utils";

const COUNTABLE_TRANSACTION_STATUSES = new Set(["PENDING", "PROCESSING", "COMPLETED"]);

async function fetchAccountUser(userId: string, activeBrandId: string, today: Date) {
  return prisma.user.findUnique({
    where: { id: userId },
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
            },
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
  });
}

type AccountUser = NonNullable<Awaited<ReturnType<typeof fetchAccountUser>>>;
type MembershipWithQuota = AccountUser["memberships"][number];
type AccountTransaction = AccountUser["transactions"][number];

function buildPurchaseCountByProductId(transactions: AccountTransaction[]) {
  const purchaseCountByProductId: Record<string, number> = {};

  for (const transaction of transactions) {
    if (!COUNTABLE_TRANSACTION_STATUSES.has(transaction.status)) continue;
    purchaseCountByProductId[transaction.productId] = (purchaseCountByProductId[transaction.productId] || 0) + 1;
  }

  return purchaseCountByProductId;
}

function formatMembershipTransaction(transaction: MembershipWithQuota["transaction"]) {
  if (!transaction) return null;

  return {
    id: transaction.id,
    status: transaction.status,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    paidAt: transaction.paidAt?.toISOString() || null,
    createdAt: transaction.createdAt.toISOString(),
  };
}

function formatMembership(m: MembershipWithQuota) {
  return {
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
    transaction: formatMembershipTransaction(m.transaction),
  };
}

function formatPurchaseHistory(transactions: AccountTransaction[], purchaseCountByProductId: Record<string, number>) {
  return transactions.map((transaction) => {
    const { product } = transaction;
    const isPurchaseUnlimited = product.isPurchaseUnlimited;

    return {
      id: transaction.id,
      status: transaction.status,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentProvider: transaction.paymentProvider,
      paidAt: transaction.paidAt?.toISOString() || null,
      createdAt: transaction.createdAt.toISOString(),
      product: {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        isPurchaseUnlimited,
        purchaseLimitPerUser: product.purchaseLimitPerUser,
      },
      timesBought: isPurchaseUnlimited ? null : purchaseCountByProductId[product.id] || 0,
    };
  });
}

async function formatUpcomingBookings(bookings: AccountUser["bookings"], activeBrandId: string) {
  const settings = await getBookingSettings(activeBrandId);

  return [...bookings]
    .sort((a, b) => a.classSession.date.getTime() - b.classSession.date.getTime())
    .map((booking) => {
      const sessionStartAt = getSessionStartAt({
        date: booking.classSession.date,
        startTime: booking.classSession.startTime,
      });
      const canCancel = canMemberCancel(sessionStartAt, settings.cancellationDeadlineHours);
      const cancelDeadline = getCancelDeadline(sessionStartAt, settings.cancellationDeadlineHours);

      return {
        id: booking.id,
        canCancel,
        cancelDeadline: cancelDeadline.toISOString(),
        classSession: {
          id: booking.classSession.id,
          date: booking.classSession.date.toISOString().split("T")[0],
          startTime: booking.classSession.startTime,
          endTime: booking.classSession.endTime,
          item: booking.classSession.item,
          teacher: booking.classSession.teacher,
        },
        membership: {
          id: booking.membership.id,
          product: booking.membership.product,
        },
      };
    });
}

export async function getMyAccountData(userId: string, activeBrandId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const user = await fetchAccountUser(userId, activeBrandId, today);
  if (!user) return null;

  const now = new Date();
  const activeMemberships = user.memberships.filter(
    (membership) => membership.status === "ACTIVE" && new Date(membership.expiredAt) > now,
  );
  const frozenMemberships = user.memberships.filter(
    (membership) => membership.status === "FREEZED" && new Date(membership.expiredAt) > now,
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

  const purchaseCountByProductId = buildPurchaseCountByProductId(user.transactions);

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
    freezeRequests: freezeRequests.map((freezeRequest) => ({
      id: freezeRequest.id,
      membershipId: freezeRequest.membershipId,
      reason: freezeRequest.reason,
      reasonDetails: freezeRequest.reasonDetails,
      status: freezeRequest.status,
      freezeStartDate: freezeRequest.freezeStartDate?.toISOString() ?? null,
      freezeEndDate: freezeRequest.freezeEndDate?.toISOString() ?? null,
      createdAt: freezeRequest.createdAt.toISOString(),
      membership: freezeRequest.membership,
    })),
    allMemberships: user.memberships.map((membership) => ({
      id: membership.id,
      status: membership.status,
      joinDate: membership.joinDate.toISOString(),
      expiredAt: membership.expiredAt.toISOString(),
      product: {
        id: membership.product.id,
        name: membership.product.name,
        price: Number(membership.product.price),
        validDays: membership.product.validDays,
      },
      transaction: formatMembershipTransaction(membership.transaction),
    })),
    purchaseHistory: formatPurchaseHistory(user.transactions, purchaseCountByProductId),
    upcomingBookings: await formatUpcomingBookings(user.bookings, activeBrandId),
  };
}

export type MyAccountData = NonNullable<Awaited<ReturnType<typeof getMyAccountData>>>;
