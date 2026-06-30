import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPostAuthRedirectPath } from "@/lib/auth-session";

interface AuthContinuePageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function AuthContinuePage({ searchParams }: AuthContinuePageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (!session) {
    const params = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/sign-in${params}`);
  }

  redirect(getPostAuthRedirectPath(session.user.role, callbackUrl));
}
