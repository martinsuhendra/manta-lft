import type { Session } from "next-auth";

import { ShopHeader } from "./shop-header";

interface ShopHeaderWrapperProps {
  session: Session | null;
}

export function ShopHeaderWrapper({ session }: ShopHeaderWrapperProps) {
  return <ShopHeader session={session} />;
}
