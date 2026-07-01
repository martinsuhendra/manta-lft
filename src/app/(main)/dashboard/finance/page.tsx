import { FinanceDashboardHeader } from "./_components/finance-dashboard-header";
import { FinanceKpiCards } from "./_components/finance-kpi-cards";
import { FinanceQuickStats } from "./_components/finance-quick-stats";
import { FinanceRevenueByProduct } from "./_components/finance-revenue-by-product";
import { FinanceRevenueChart } from "./_components/finance-revenue-chart";
import { FinanceTransactionsTable } from "./_components/finance-transactions-table";

export default function FinancePage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <FinanceDashboardHeader />
      <FinanceKpiCards />
      <FinanceRevenueChart />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinanceRevenueByProduct />
        </div>
        <div>
          <FinanceQuickStats />
        </div>
      </div>
      <FinanceTransactionsTable />
    </div>
  );
}
