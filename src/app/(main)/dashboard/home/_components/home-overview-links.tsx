import Link from "next/link";

import { ArrowRight, BarChart3, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeOverviewLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="text-primary size-5" />
            <CardTitle>CRM</CardTitle>
          </div>
          <CardDescription>
            Membership status, attendance, sessions, teacher workload, and member action queues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>Membership breakdown & growth</li>
            <li>Today&apos;s schedule & fill rates</li>
            <li>Expiring memberships & freeze requests</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/crm">
              Open CRM
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary size-5" />
            <CardTitle>Finance Overview</CardTitle>
          </div>
          <CardDescription>Revenue trends, product mix, recent transactions, and payroll costs.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>Monthly revenue & refunds</li>
            <li>Revenue by product</li>
            <li>Recent transactions & payroll MTD</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/finance">
              Open Finance
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
