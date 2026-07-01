"use client";

import Link from "next/link";

import { format } from "date-fns";
import { Calendar, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandStore } from "@/stores/brand/brand-provider";

export function CrmDashboardHeader() {
  const brands = useBrandStore((s) => s.brands);
  const activeBrandId = useBrandStore((s) => s.activeBrandId);

  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const brandLabel = activeBrandId === "ALL" ? "All Brands" : (activeBrand?.name ?? "All Brands");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-muted-foreground text-sm">
          Members, attendance & studio operations — {format(new Date(), "EEEE, MMM d, yyyy")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="px-2.5 py-1 font-normal">
          {brandLabel}
        </Badge>
        <Select defaultValue="this-month">
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This week</SelectItem>
            <SelectItem value="this-month">This month</SelectItem>
            <SelectItem value="last-30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/sessions">
            <Calendar className="mr-1.5 h-4 w-4" />
            Sessions
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/users">
            <Users className="mr-1.5 h-4 w-4" />
            Members
          </Link>
        </Button>
      </div>
    </div>
  );
}
