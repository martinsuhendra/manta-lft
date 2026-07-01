import { CrmDashboardHeader } from "./_components/crm-dashboard-header";
import { CrmKpiCards } from "./_components/crm-kpi-cards";
import { CrmMembershipBreakdown } from "./_components/crm-membership-breakdown";
import { CrmOperationsInsights } from "./_components/crm-operations-insights";
import { CrmOperationsTables } from "./_components/crm-operations-tables";
import { CrmQuickStats } from "./_components/crm-quick-stats";
import { CrmTodaySchedule } from "./_components/crm-today-schedule";

export default function CrmPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <CrmDashboardHeader />
      <CrmKpiCards />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CrmMembershipBreakdown />
        </div>
        <div className="lg:col-span-2">
          <CrmTodaySchedule />
        </div>
      </div>
      <CrmOperationsInsights />
      <CrmOperationsTables />
      <CrmQuickStats />
    </div>
  );
}
