import { prisma } from "@/lib/generated/prisma";

export const DEFAULT_WAIVER_NAME = "General waiver";

export const DEFAULT_WAIVER_CONTENT_HTML = `
<h1>Waiver and Release of Liability Form</h1>
<ol>
  <li>
    <strong>Assumption of Risk:</strong> I, [Member Name], understand that using the facility, equipment, and participating in classes at [Gym Name] involves inherent risks of injury, including but not limited to broken bones, muscle strains, heart attacks, or death. I voluntarily assume all risks, both known and unknown, associated with my participation, even if arising from the negligence of [Gym Name].
  </li>
  <li>
    <strong>Release of Liability:</strong> I hereby release, waive, discharge, and covenant not to sue [Gym Name], its owners, employees, or agents from any and all liability, claims, or demands for personal injury, property damage, or wrongful death occurring on the premises, including parking lots.
  </li>
  <li>
    <strong>Medical Treatment:</strong> I consent to receive first aid or medical treatment in the event of an accident or illness.
  </li>
  <li>
    <strong>Indemnification:</strong> I agree to indemnify and hold harmless [Gym Name] against any claims, damages, or expenses (including attorney fees) that may result from my participation.
  </li>
</ol>
<p><strong>I HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, AND SIGN IT VOLUNTARILY.</strong></p>
<p>Member Signature: _______________________ Date: ___________</p>
`.trim();

export interface WaiverRecord {
  id: string;
  name: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
  sortOrder: number;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaiverAcceptanceRecord {
  waiverId: string;
  acceptedVersion: number;
  acceptedAt: Date;
  acceptedIp: string | null;
  acceptedUserAgent: string | null;
}

export interface WaiverWithAcceptance extends WaiverRecord {
  hasAccepted: boolean;
  acceptedVersion: number | null;
  acceptedAt: Date | null;
}

export interface UserWaiverCompliance {
  hasAcceptedAllActive: boolean;
  activeWaivers: WaiverRecord[];
  acceptances: WaiverAcceptanceRecord[];
  pendingWaivers: WaiverRecord[];
  latestAcceptedAt: Date | null;
}

export interface CreateWaiverInput {
  name: string;
  contentHtml: string;
  isActive?: boolean;
  sortOrder?: number;
  updatedById?: string | null;
}

export interface UpdateWaiverInput {
  name?: string;
  contentHtml?: string;
  isActive?: boolean;
  sortOrder?: number;
  updatedById?: string | null;
}

export interface AcceptWaiverInput {
  userId: string;
  waiverId: string;
  version: number;
  acceptedIp?: string | null;
  acceptedUserAgent?: string | null;
}

function normalizeHtml(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

export function isMeaningfulWaiverHtml(value: string): boolean {
  const text = value
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&nbsp;/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

export function hasAcceptedWaiverVersion({
  acceptedVersion,
  waiverVersion,
}: {
  acceptedVersion: number | null | undefined;
  waiverVersion: number;
}): boolean {
  if (!acceptedVersion) return false;
  return acceptedVersion >= waiverVersion;
}

export async function listWaivers(): Promise<WaiverRecord[]> {
  return prisma.waiver.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getActiveWaivers(): Promise<WaiverRecord[]> {
  return prisma.waiver.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getWaiverById(id: string): Promise<WaiverRecord | null> {
  return prisma.waiver.findUnique({ where: { id } });
}

export async function ensureDefaultWaiver(): Promise<WaiverRecord> {
  const existing = await prisma.waiver.findFirst({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;

  return prisma.waiver.create({
    data: {
      name: DEFAULT_WAIVER_NAME,
      contentHtml: DEFAULT_WAIVER_CONTENT_HTML,
      version: 1,
      isActive: true,
      sortOrder: 0,
    },
  });
}

export async function createWaiver(input: CreateWaiverInput): Promise<WaiverRecord> {
  const { _max: sortOrderMax } = await prisma.waiver.aggregate({ _max: { sortOrder: true } });

  return prisma.waiver.create({
    data: {
      name: input.name.trim(),
      contentHtml: input.contentHtml,
      version: 1,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? (sortOrderMax.sortOrder ?? 0) + 1,
      updatedById: input.updatedById ?? null,
    },
  });
}

export async function updateWaiver(id: string, input: UpdateWaiverInput): Promise<WaiverRecord> {
  const current = await prisma.waiver.findUnique({ where: { id } });
  if (!current) throw new Error("Waiver not found");

  const nextContentHtml = input.contentHtml ?? current.contentHtml;
  const isContentChanged =
    input.contentHtml != null && normalizeHtml(current.contentHtml) !== normalizeHtml(nextContentHtml);

  return prisma.waiver.update({
    where: { id },
    data: {
      name: input.name?.trim() ?? current.name,
      contentHtml: nextContentHtml,
      isActive: input.isActive ?? current.isActive,
      sortOrder: input.sortOrder ?? current.sortOrder,
      updatedById: input.updatedById ?? current.updatedById,
      version: isContentChanged ? current.version + 1 : current.version,
    },
  });
}

export async function getUserWaiverAcceptances(userId: string): Promise<WaiverAcceptanceRecord[]> {
  const rows = await prisma.userWaiverAcceptance.findMany({
    where: { userId },
    select: {
      waiverId: true,
      acceptedVersion: true,
      acceptedAt: true,
      acceptedIp: true,
      acceptedUserAgent: true,
    },
  });

  return rows;
}

export async function getUserWaiverCompliance(userId: string): Promise<UserWaiverCompliance> {
  const [activeWaivers, acceptances] = await Promise.all([getActiveWaivers(), getUserWaiverAcceptances(userId)]);

  const acceptanceByWaiverId = new Map(acceptances.map((acceptance) => [acceptance.waiverId, acceptance]));

  const pendingWaivers = activeWaivers.filter((waiver) => {
    const acceptance = acceptanceByWaiverId.get(waiver.id);
    return !hasAcceptedWaiverVersion({
      acceptedVersion: acceptance?.acceptedVersion,
      waiverVersion: waiver.version,
    });
  });

  const latestAcceptedAt = acceptances.reduce<Date | null>((latest, acceptance) => {
    if (!latest || acceptance.acceptedAt > latest) return acceptance.acceptedAt;
    return latest;
  }, null);

  return {
    hasAcceptedAllActive: activeWaivers.length === 0 || pendingWaivers.length === 0,
    activeWaivers,
    acceptances,
    pendingWaivers,
    latestAcceptedAt: pendingWaivers.length === 0 ? latestAcceptedAt : null,
  };
}

export async function hasUserAcceptedAllActiveWaivers(userId: string): Promise<boolean> {
  const compliance = await getUserWaiverCompliance(userId);
  return compliance.hasAcceptedAllActive;
}

export async function acceptWaiverForUser(input: AcceptWaiverInput): Promise<WaiverAcceptanceRecord> {
  const waiver = await prisma.waiver.findUnique({ where: { id: input.waiverId } });
  if (!waiver) throw new Error("Waiver not found");
  if (!waiver.isActive) throw new Error("Waiver is not active");
  if (input.version !== waiver.version) throw new Error("Waiver version is outdated");

  const existing = await prisma.userWaiverAcceptance.findUnique({
    where: {
      userId_waiverId: {
        userId: input.userId,
        waiverId: input.waiverId,
      },
    },
  });

  if (
    existing &&
    hasAcceptedWaiverVersion({
      acceptedVersion: existing.acceptedVersion,
      waiverVersion: waiver.version,
    })
  ) {
    return existing;
  }

  return prisma.userWaiverAcceptance.upsert({
    where: {
      userId_waiverId: {
        userId: input.userId,
        waiverId: input.waiverId,
      },
    },
    create: {
      userId: input.userId,
      waiverId: input.waiverId,
      acceptedVersion: waiver.version,
      acceptedIp: input.acceptedIp ?? null,
      acceptedUserAgent: input.acceptedUserAgent ?? null,
    },
    update: {
      acceptedVersion: waiver.version,
      acceptedAt: new Date(),
      acceptedIp: input.acceptedIp ?? null,
      acceptedUserAgent: input.acceptedUserAgent ?? null,
    },
    select: {
      waiverId: true,
      acceptedVersion: true,
      acceptedAt: true,
      acceptedIp: true,
      acceptedUserAgent: true,
    },
  });
}

export async function acceptAllActiveWaiversForUser({
  userId,
  acceptedIp,
  acceptedUserAgent,
}: {
  userId: string;
  acceptedIp?: string | null;
  acceptedUserAgent?: string | null;
}): Promise<WaiverAcceptanceRecord[]> {
  const activeWaivers = await getActiveWaivers();
  if (activeWaivers.length === 0) return [];

  return Promise.all(
    activeWaivers.map((waiver) =>
      acceptWaiverForUser({
        userId,
        waiverId: waiver.id,
        version: waiver.version,
        acceptedIp,
        acceptedUserAgent,
      }),
    ),
  );
}

export async function setUserWaiverAcceptance({
  userId,
  waiverId,
  isAccepted,
}: {
  userId: string;
  waiverId: string;
  isAccepted: boolean;
}): Promise<WaiverAcceptanceRecord | null> {
  if (!isAccepted) {
    await prisma.userWaiverAcceptance.deleteMany({
      where: { userId, waiverId },
    });
    return null;
  }

  const waiver = await prisma.waiver.findUnique({ where: { id: waiverId } });
  if (!waiver) throw new Error("Waiver not found");

  return acceptWaiverForUser({
    userId,
    waiverId,
    version: waiver.version,
  });
}

export async function enrichUsersWithWaiverSummary<T extends { id: string }>(
  users: T[],
): Promise<Array<T & { waiverAcceptedAt: Date | null; hasAcceptedAllWaivers: boolean }>> {
  const activeWaivers = await getActiveWaivers();
  if (users.length === 0) return [];

  if (activeWaivers.length === 0) {
    return users.map((user) => ({
      ...user,
      waiverAcceptedAt: null,
      hasAcceptedAllWaivers: true,
    }));
  }

  const acceptances = await prisma.userWaiverAcceptance.findMany({
    where: {
      userId: { in: users.map((user) => user.id) },
      waiverId: { in: activeWaivers.map((waiver) => waiver.id) },
    },
    select: {
      userId: true,
      waiverId: true,
      acceptedVersion: true,
      acceptedAt: true,
    },
  });

  const acceptancesByUserId = new Map<string, typeof acceptances>();
  for (const acceptance of acceptances) {
    const current = acceptancesByUserId.get(acceptance.userId) ?? [];
    current.push(acceptance);
    acceptancesByUserId.set(acceptance.userId, current);
  }

  return users.map((user) => {
    const userAcceptances = acceptancesByUserId.get(user.id) ?? [];
    const acceptanceByWaiverId = new Map(userAcceptances.map((entry) => [entry.waiverId, entry]));

    const pendingWaivers = activeWaivers.filter((waiver) => {
      const acceptance = acceptanceByWaiverId.get(waiver.id);
      return !hasAcceptedWaiverVersion({
        acceptedVersion: acceptance?.acceptedVersion,
        waiverVersion: waiver.version,
      });
    });

    const latestAcceptedAt = userAcceptances.reduce<Date | null>((latest, acceptance) => {
      if (!latest || acceptance.acceptedAt > latest) return acceptance.acceptedAt;
      return latest;
    }, null);

    return {
      ...user,
      waiverAcceptedAt: pendingWaivers.length === 0 ? latestAcceptedAt : null,
      hasAcceptedAllWaivers: pendingWaivers.length === 0,
    };
  });
}

export async function getMemberWaiverStatus(userId: string): Promise<{
  waivers: WaiverWithAcceptance[];
  hasAcceptedAll: boolean;
  pendingWaivers: WaiverRecord[];
}> {
  const [activeWaivers, acceptances] = await Promise.all([getActiveWaivers(), getUserWaiverAcceptances(userId)]);

  const acceptanceByWaiverId = new Map(acceptances.map((acceptance) => [acceptance.waiverId, acceptance]));

  const waivers: WaiverWithAcceptance[] = activeWaivers.map((waiver) => {
    const acceptance = acceptanceByWaiverId.get(waiver.id);
    const hasAccepted = hasAcceptedWaiverVersion({
      acceptedVersion: acceptance?.acceptedVersion,
      waiverVersion: waiver.version,
    });

    return {
      ...waiver,
      hasAccepted,
      acceptedVersion: acceptance?.acceptedVersion ?? null,
      acceptedAt: acceptance?.acceptedAt ?? null,
    };
  });

  const pendingWaivers = activeWaivers.filter((waiver) => {
    const acceptance = acceptanceByWaiverId.get(waiver.id);
    return !hasAcceptedWaiverVersion({
      acceptedVersion: acceptance?.acceptedVersion,
      waiverVersion: waiver.version,
    });
  });

  return {
    waivers,
    hasAcceptedAll: pendingWaivers.length === 0,
    pendingWaivers,
  };
}
