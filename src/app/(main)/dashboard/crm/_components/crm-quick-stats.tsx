"use client";

import { ClipboardX, FileWarning, Users } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { SectionCardsGrid } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CrmQuickStatsProps {
  data?: DashboardOverview;
}

export function CrmQuickStats({ data = dashboardOverviewMock }: CrmQuickStatsProps) {
  const { quickStats } = data;

  return (
    <SectionCardsGrid columns={3}>
      <Card className="@container/card">
        <CardHeader>
          <div className="bg-destructive/10 w-fit rounded-lg p-2">
            <ClipboardX className="text-destructive size-5" />
          </div>
          <CardTitle className="text-base">No-show Rate</CardTitle>
          <CardDescription>Reserved but did not check in</CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-2xl font-semibold tabular-nums">{quickStats.noShowRate}%</p>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="w-fit rounded-lg bg-blue-500/10 p-2">
            <Users className="size-5 text-blue-500" />
          </div>
          <CardTitle className="text-base">Waitlist</CardTitle>
          <CardDescription>Members waiting for spots</CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-2xl font-semibold tabular-nums">{quickStats.waitlistCount}</p>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <div className="w-fit rounded-lg bg-yellow-500/10 p-2">
            <FileWarning className="size-5 text-yellow-500" />
          </div>
          <CardTitle className="text-base">Unsigned Waivers</CardTitle>
          <CardDescription>Members missing waiver acceptance</CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-2xl font-semibold tabular-nums">{quickStats.unsignedWaivers}</p>
        </CardFooter>
      </Card>
    </SectionCardsGrid>
  );
}
