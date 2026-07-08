"use client";

import { format } from "date-fns";

import { TransactionDiscountSummary } from "@/components/product-price-display";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAdminTransactionDetail } from "@/hooks/use-admin-transactions-query";

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "warning" | "success" {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED" || status === "CANCELLED") return "destructive";
  if (status === "REFUNDED" || status === "EXPIRED") return "outline";
  return "secondary";
}

export function TransactionDetailDrawer({ transactionId, open, onOpenChange }: TransactionDetailDrawerProps) {
  const { data, isLoading } = useAdminTransactionDetail(transactionId, open);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Transaction Details</DrawerTitle>
          <DrawerDescription>Review complete transaction information and linked memberships.</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-4 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Loading transaction details...</p>
          ) : !data ? (
            <p className="text-muted-foreground">Transaction details are unavailable.</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">Transaction ID</p>
                <p className="font-medium break-all">{data.id}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">User</p>
                  <p className="font-medium">{data.userName}</p>
                  <p className="text-muted-foreground break-all">{data.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Product</p>
                  <p className="font-medium">{data.productName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount</p>
                  <TransactionDiscountSummary
                    listPrice={data.listPrice}
                    amount={data.amount}
                    productDiscountAmount={data.productDiscountAmount}
                    promoDiscountAmount={data.promoDiscountAmount}
                    promoCode={data.promoCode}
                  />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <StatusBadge variant={getStatusVariant(data.status)}>{data.status}</StatusBadge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <p>{data.paymentMethod ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Provider</p>
                  <p>{data.paymentProvider ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created At</p>
                  <p>{format(new Date(data.createdAt), "dd MMM yyyy, HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Paid At</p>
                  <p>{data.paidAt ? format(new Date(data.paidAt), "dd MMM yyyy, HH:mm") : "-"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Linked Memberships</p>
                {!data.memberships.length ? (
                  <p className="text-muted-foreground">No memberships linked.</p>
                ) : (
                  data.memberships.map((membership) => (
                    <div key={membership.id} className="rounded-md border p-3">
                      <p className="font-medium break-all">{membership.id}</p>
                      <p className="text-muted-foreground">
                        {membership.status} - {format(new Date(membership.joinDate), "dd MMM yyyy")} to{" "}
                        {format(new Date(membership.expiredAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
