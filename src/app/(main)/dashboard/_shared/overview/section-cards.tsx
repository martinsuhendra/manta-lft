"use client";

import type { ReactNode } from "react";

import { TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatPrice } from "@/lib/utils";

/** Matches gradient + shadow applied to direct child `Card` components (`data-slot="card"`). */
export const sectionCardsGradientGridClassName =
  "*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs";

function sectionCardsGridColsClass(columns: 1 | 3 | 4) {
  if (columns === 1) return "grid grid-cols-1 gap-4";
  if (columns === 3) return "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3";
  return "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4";
}

export function SectionCardsGrid({
  children,
  className,
  columns = 4,
}: {
  children: ReactNode;
  className?: string;
  columns?: 1 | 3 | 4;
}) {
  return (
    <div className={cn(sectionCardsGradientGridClassName, sectionCardsGridColsClass(columns), className)}>
      {children}
    </div>
  );
}

export function SectionCards() {
  return (
    <SectionCardsGrid columns={4}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatPrice(1250)}
          </CardTitle>
          <CardAction>
            <StatusBadge variant="outline">
              <TrendingUp />
              +12.5%
            </StatusBadge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Visitors for the last 6 months</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">1,234</CardTitle>
          <CardAction>
            <StatusBadge variant="outline">
              <TrendingDown />
              -20%
            </StatusBadge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Acquisition needs attention</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">45,678</CardTitle>
          <CardAction>
            <StatusBadge variant="outline">
              <TrendingUp />
              +12.5%
            </StatusBadge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">4.5%</CardTitle>
          <CardAction>
            <StatusBadge variant="outline">
              <TrendingUp />
              +4.5%
            </StatusBadge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </SectionCardsGrid>
  );
}
