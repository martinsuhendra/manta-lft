import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { resolveActiveBrandIdFromCookie } from "@/lib/brand-cookie";
import { getMyAccountData } from "@/lib/public/my-account-data";

import { MyAccountContent } from "./_components/my-account-content";

export const metadata: Metadata = {
  title: `My Account - ${APP_CONFIG.name}`,
  description: "View your account details, membership, and purchase history",
};

async function getAccountData() {
  try {
    const session = await auth();

    if (!session?.user.id) {
      redirect("/public");
    }

    const activeBrandId = await resolveActiveBrandIdFromCookie();
    if (!activeBrandId) {
      redirect("/public");
    }

    const accountData = await getMyAccountData(session.user.id, activeBrandId);
    if (!accountData) {
      redirect("/public");
    }

    return accountData;
  } catch (error) {
    console.error("Failed to fetch account data:", error);
    redirect("/public");
  }
}

export default async function MyAccountPage() {
  const accountData = await getAccountData();

  return <MyAccountContent accountData={accountData} />;
}
