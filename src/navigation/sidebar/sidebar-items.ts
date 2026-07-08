import {
  BadgeCheck,
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  FileText,
  ChartBar,
  LayoutDashboard,
  Package,
  Snowflake,
  UserCircle2,
  Users,
  Wallet,
  ReceiptText,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";

import {
  RBAC_ADMIN_ROLES,
  RBAC_DEVELOPER_ONLY_ROLES,
  RBAC_PAYROLL_MENU_ROLES,
  RBAC_SESSIONS_MENU_ROLES,
  RBAC_SUPERADMIN_EDGE_ROLES,
} from "@/lib/rbac";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredRoles?: string[];
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "Home",
        url: "/dashboard/home",
        icon: LayoutDashboard,
      },
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Users & Membership",
        url: "/dashboard/users",
        icon: Users,
        comingSoon: false,
        requiredRoles: [...RBAC_ADMIN_ROLES],
        subItems: [
          {
            title: "Users",
            url: "/dashboard/users",
            icon: UserCircle2,
          },
          {
            title: "Memberships",
            url: "/dashboard/admin/memberships",
            icon: BadgeCheck,
          },
          {
            title: "Freeze Requests",
            url: "/dashboard/admin/freeze-requests",
            icon: Snowflake,
          },
        ],
      },
      {
        title: "Classes",
        url: "/dashboard/admin/items",
        icon: Calendar,
        comingSoon: false,
        requiredRoles: [...RBAC_SUPERADMIN_EDGE_ROLES],
      },
      {
        title: "Products",
        url: "/dashboard/products",
        icon: Package,
        comingSoon: false,
        requiredRoles: [...RBAC_SUPERADMIN_EDGE_ROLES],
      },
      {
        title: "Sessions",
        url: "/dashboard/admin/sessions",
        icon: Calendar,
        comingSoon: false,
        requiredRoles: [...RBAC_SESSIONS_MENU_ROLES],
      },
    ],
  },
  {
    id: 3,
    label: "Finance",
    items: [
      {
        title: "Overview",
        url: "/dashboard/finance",
        icon: BarChart3,
        requiredRoles: [...RBAC_ADMIN_ROLES],
      },
      {
        title: "Payroll",
        url: "/dashboard/finance/payroll",
        icon: Wallet,
        requiredRoles: [...RBAC_PAYROLL_MENU_ROLES],
      },
      {
        title: "Transactions",
        url: "/dashboard/finance/transactions",
        icon: ReceiptText,
        requiredRoles: [...RBAC_ADMIN_ROLES],
      },
      {
        title: "Promo codes",
        url: "/dashboard/finance/promo-codes",
        icon: TicketPercent,
        requiredRoles: [...RBAC_ADMIN_ROLES],
      },
    ],
  },
  {
    id: 4,
    label: "Organization",
    items: [
      {
        title: "Brands",
        url: "/dashboard/admin/brands",
        icon: Building2,
        comingSoon: false,
        requiredRoles: [...RBAC_DEVELOPER_ONLY_ROLES],
      },
    ],
  },
  {
    id: 5,
    label: "Settings",
    items: [
      {
        title: "Booking",
        url: "/dashboard/settings/booking",
        icon: CalendarClock,
        comingSoon: false,
        requiredRoles: [...RBAC_ADMIN_ROLES],
      },
      {
        title: "Waivers",
        url: "/dashboard/settings/waiver-content",
        icon: FileText,
        comingSoon: false,
        requiredRoles: [...RBAC_ADMIN_ROLES],
      },
    ],
  },
];
