import { CrmTodaySchedule } from "@/app/(main)/dashboard/crm/_components/crm-today-schedule";

import { HomeDashboardHeader } from "./_components/home-dashboard-header";
import { HomeOverviewLinks } from "./_components/home-overview-links";
import { HomeSummaryCards } from "./_components/home-summary-cards";

export default function HomePage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <HomeDashboardHeader />
      <HomeSummaryCards />
      <CrmTodaySchedule />
      <HomeOverviewLinks />
    </div>
  );
}
