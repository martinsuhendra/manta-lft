import { NextRequest, NextResponse } from "next/server";

import { handleApiError, requireAuth } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";
import { perParticipantSessionFeeIdr } from "@/lib/per-participant-session-fee";
import { RBAC_ADMIN_ROLES } from "@/lib/rbac";
import type { TeacherFeeModel } from "@/lib/teacher-fee-model";
import { USER_ROLES } from "@/lib/types";

const MAX_DAYS_RANGE = 365;

/** Bookings that count toward per-participant payroll headcount */
const PAYROLL_BILLABLE_BOOKING_STATUSES = ["CHECKED_IN"] as const;

interface TeacherFeeConfig {
  feeAmount: number;
  feeModel: TeacherFeeModel;
  perParticipantMinGuarantee: number | null;
  perParticipantGuaranteeMaxPax: number | null;
}

function sessionFeeForConfig(config: TeacherFeeConfig | undefined, pax: number): number {
  if (!config) return 0;
  if (config.feeModel === "PER_PARTICIPANT") {
    return perParticipantSessionFeeIdr({
      ratePerPerson: config.feeAmount,
      billablePax: pax,
      minGuarantee: config.perParticipantMinGuarantee,
      guaranteeMaxPax: config.perParticipantGuaranteeMaxPax,
    });
  }
  return config.feeAmount;
}

/* eslint-disable complexity */
export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth();
    if (error) return error;

    const isAdmin = RBAC_ADMIN_ROLES.includes(session.user.role);
    const isTeacher = session.user.role === USER_ROLES.TEACHER;
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    let teacherId = searchParams.get("teacherId") || undefined;
    if (isTeacher) {
      teacherId = session.user.id;
    }
    const itemId = searchParams.get("itemId") || undefined;
    // Payroll only counts COMPLETED sessions; cancelled/scheduled sessions do not earn teacher fees
    const status = "COMPLETED" as const;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultEnd = new Date(today);
    defaultEnd.setMonth(defaultEnd.getMonth() + 1);
    defaultEnd.setDate(0); // last day of current month
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    if (startDate > endDate) {
      return NextResponse.json({ error: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > MAX_DAYS_RANGE) {
      return NextResponse.json({ error: `Date range cannot exceed ${MAX_DAYS_RANGE} days` }, { status: 400 });
    }

    const sessions = await prisma.classSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status,
        teacherId: { not: null },
        ...(teacherId && { teacherId }),
        ...(itemId && { itemId }),
      },
      include: {
        item: { select: { id: true, name: true, price: true } },
        teacher: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const sessionIds = sessions.map((s) => s.id);
    const paxBySessionId = new Map<string, number>();
    if (sessionIds.length > 0) {
      const bookingGroups = await prisma.booking.groupBy({
        by: ["classSessionId"],
        where: {
          classSessionId: { in: sessionIds },
          status: { in: [...PAYROLL_BILLABLE_BOOKING_STATUSES] },
        },
        _sum: { participantCount: true },
      });
      for (const g of bookingGroups) {
        paxBySessionId.set(
          g.classSessionId,
          // eslint-disable-next-line no-underscore-dangle -- Prisma groupBy aggregate shape
          g._sum.participantCount ?? 0,
        );
      }
    }

    const pairKeys = [...new Set(sessions.map((s) => `${s.teacherId}:${s.itemId}`))];
    const teacherItemPairs = pairKeys
      .map((key) => {
        const [tid, iid] = key.split(":");
        return { teacherId: tid, itemId: iid };
      })
      .filter((p) => p.teacherId && p.itemId);

    const teacherItems = await prisma.teacherItem.findMany({
      where: {
        OR: teacherItemPairs.map((p) => ({ teacherId: p.teacherId, itemId: p.itemId })),
      },
      select: {
        teacherId: true,
        itemId: true,
        feeAmount: true,
        feeModel: true,
        perParticipantMinGuarantee: true,
        perParticipantGuaranteeMaxPax: true,
      },
    });

    const configByPair = new Map<string, TeacherFeeConfig>();
    for (const ti of teacherItems) {
      configByPair.set(`${ti.teacherId}:${ti.itemId}`, {
        feeAmount: ti.feeAmount,
        feeModel: ti.feeModel,
        perParticipantMinGuarantee: ti.perParticipantMinGuarantee,
        perParticipantGuaranteeMaxPax: ti.perParticipantGuaranteeMaxPax,
      });
    }

    type ByItem = {
      itemId: string;
      itemName: string;
      sessionsCount: number;
      sessionDates: string[];
      feeModel: TeacherFeeModel;
      feeAmount: number;
      perParticipantMinGuarantee: number | null;
      perParticipantGuaranteeMaxPax: number | null;
      totalParticipants: number;
      avgFeePerSession: number;
      totalFee: number;
    };

    const teacherMap = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        teacherEmail: string | null;
        teacherImage: string | null;
        byItem: Map<string, ByItem>;
        totalFee: number;
      }
    >();

    for (const s of sessions) {
      const tid = s.teacherId!;
      const teacher = s.teacher!;
      const config = configByPair.get(`${tid}:${s.itemId}`);
      const pax = paxBySessionId.get(s.id) ?? 0;
      const sessionFee = sessionFeeForConfig(config, pax);

      if (!teacherMap.has(tid)) {
        teacherMap.set(tid, {
          teacherId: tid,
          teacherName: teacher.name ?? "—",
          teacherEmail: teacher.email ?? null,
          teacherImage: teacher.image ?? null,
          byItem: new Map(),
          totalFee: 0,
        });
      }
      const row = teacherMap.get(tid)!;
      const itemKey = s.item.id;
      if (!row.byItem.has(itemKey)) {
        row.byItem.set(itemKey, {
          itemId: s.item.id,
          itemName: s.item.name,
          sessionsCount: 0,
          sessionDates: [],
          feeModel: config?.feeModel ?? "FLAT_PER_SESSION",
          feeAmount: config?.feeAmount ?? 0,
          perParticipantMinGuarantee: config?.perParticipantMinGuarantee ?? null,
          perParticipantGuaranteeMaxPax: config?.perParticipantGuaranteeMaxPax ?? null,
          totalParticipants: 0,
          avgFeePerSession: 0,
          totalFee: 0,
        });
      }
      const byItem = row.byItem.get(itemKey)!;
      byItem.sessionsCount += 1;
      byItem.sessionDates.push(s.date.toISOString().slice(0, 10));
      if (config?.feeModel === "PER_PARTICIPANT") byItem.totalParticipants += pax;
      byItem.totalFee += sessionFee;
      row.totalFee += sessionFee;
    }

    const rows = Array.from(teacherMap.values()).map((r) => ({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      teacherEmail: r.teacherEmail,
      teacherImage: r.teacherImage,
      sessionsCount: Array.from(r.byItem.values()).reduce((sum, b) => sum + b.sessionsCount, 0),
      byItem: Array.from(r.byItem.values()).map((b) => {
        const avgFeePerSession = b.sessionsCount > 0 ? b.totalFee / b.sessionsCount : 0;
        const sessionDates = [...new Set(b.sessionDates)].sort();
        return {
          itemId: b.itemId,
          itemName: b.itemName,
          sessionsCount: b.sessionsCount,
          sessionDates,
          feeModel: b.feeModel,
          feeAmount: b.feeAmount,
          perParticipantMinGuarantee: b.perParticipantMinGuarantee,
          perParticipantGuaranteeMaxPax: b.perParticipantGuaranteeMaxPax,
          totalParticipants: b.totalParticipants,
          avgFeePerSession: Math.round(avgFeePerSession * 100) / 100,
          totalFee: Math.round(b.totalFee * 100) / 100,
        };
      }),
      totalFee: Math.round(r.totalFee * 100) / 100,
    }));

    const grandTotalFee = Math.round(rows.reduce((sum, r) => sum + r.totalFee, 0) * 100) / 100;

    return NextResponse.json({
      period: { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) },
      rows,
      grandTotalFee,
    });
  } catch (err) {
    return handleApiError(err, "Failed to fetch payroll summary");
  }
}
