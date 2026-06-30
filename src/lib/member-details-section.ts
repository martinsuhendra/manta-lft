import type { MemberDetailsSection } from "@/hooks/use-member-details";

export function resolveMemberDetailsSection(tab: string): MemberDetailsSection | null {
  switch (tab) {
    case "sessions":
      return "classSessions";
    case "memberships":
      return "memberships";
    case "transactions":
      return "transactions";
    case "attendance":
      return "bookings";
    default:
      return null;
  }
}
