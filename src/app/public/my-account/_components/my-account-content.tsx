/* eslint-disable max-lines, complexity */
"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Calendar, CreditCard, History, Loader2, LogOut, Settings, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { APP_CONFIG } from "@/config/app-config";
import { useMemberBookingCache } from "@/hooks/use-member-booking-cache";
import { useMemberCancelBooking } from "@/hooks/use-member-sessions";
import { useMidtransSnap } from "@/lib/hooks/use-midtrans-snap";
import { formatPrice } from "@/lib/utils";

import {
  Dialog,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
} from "../../_components/public-dialog";

interface AccountData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNo: string | null;
    emergencyContact: string | null;
    birthday: string | null;
    role: string;
    createdAt: string;
  };
  activeMemberships: Array<{
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
    remainingQuota: number | null;
    product: {
      id: string;
      name: string;
      price: number;
      validDays: number;
    };
    transaction: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      paidAt: string | null;
      createdAt: string;
    } | null;
  }>;
  frozenMemberships: Array<{
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
    remainingQuota: number | null;
    product: {
      id: string;
      name: string;
      price: number;
      validDays: number;
    };
  }>;
  freezeRequests: Array<{
    id: string;
    membershipId: string;
    reason: string;
    reasonDetails: string | null;
    status: string;
    freezeStartDate: string | null;
    freezeEndDate: string | null;
    createdAt: string;
    membership: { id: string; status: string; product: { name: string } };
  }>;
  allMemberships: Array<{
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
    product: {
      id: string;
      name: string;
      price: number;
      validDays: number;
    };
    transaction: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      paidAt: string | null;
      createdAt: string;
    } | null;
  }>;
  purchaseHistory: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string | null;
    paymentProvider: string | null;
    paidAt: string | null;
    createdAt: string;
    product: {
      id: string;
      name: string;
      price: number;
      isPurchaseUnlimited: boolean;
      purchaseLimitPerUser: number | null;
    };
    timesBought: number | null;
  }>;
  upcomingBookings: Array<{
    id: string;
    canCancel: boolean;
    cancelDeadline: string;
    classSession: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      item: { id: string; name: string };
      teacher: { id: string; name: string | null; email: string | null } | null;
    };
    membership: {
      id: string;
      product: { id: string; name: string };
    };
  }>;
}

interface MyAccountContentProps {
  accountData: AccountData;
}

const ITEMS_PER_PAGE = 6;

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SimplePagination({
  total,
  perPage,
  current,
  onChange,
}: {
  total: number;
  perPage: number;
  current: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;
  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current > 1) onChange(current - 1);
            }}
            aria-disabled={current <= 1}
            className={current <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="text-muted-foreground px-2 text-sm">
            Page {current} of {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current < totalPages) onChange(current + 1);
            }}
            aria-disabled={current >= totalPages}
            className={current >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

async function handleReopenPayment(
  transactionId: string,
  setReopeningPayment: (id: string | null) => void,
  isSnapLoaded: boolean,
  openSnap: (
    token: string,
    options?: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void },
  ) => void,
  router: ReturnType<typeof useRouter>,
  refreshAfterPayment: (transactionId?: string) => Promise<void>,
) {
  if (!isSnapLoaded) {
    toast.error("Payment gateway not ready", { description: "Please wait a moment and try again." });
    return;
  }
  setReopeningPayment(transactionId);
  try {
    const response = await fetch(`/api/transactions/${transactionId}/snap-token`);
    const result = await response.json();
    if (!response.ok) {
      toast.error("Failed to open payment", { description: result.error || "Something went wrong." });
      return;
    }
    openSnap(result.snapToken, {
      onSuccess: async () => {
        await refreshAfterPayment(transactionId);
        toast.success("Payment successful!", { description: "Your membership has been activated." });
        router.refresh();
      },
      onPending: async () => {
        await refreshAfterPayment(transactionId);
        toast.info("Payment pending", { description: "Waiting for payment confirmation." });
        router.refresh();
      },
      onError: () => {
        toast.error("Payment failed", { description: "Please try again or contact support." });
      },
      onClose: () => {
        toast.info("Payment cancelled", { description: "You can continue the payment anytime." });
      },
    });
  } catch {
    toast.error("Something went wrong", { description: "Please try again later." });
  } finally {
    setReopeningPayment(null);
  }
}

const editProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    phoneNo: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    emergencyContact: z
      .string()
      .min(10, "Emergency contact must be at least 10 digits")
      .max(15, "Emergency contact must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid emergency contact format"),
    birthday: z.string().min(1, "Birthday is required"),
  })
  .superRefine((data, ctx) => {
    if (normalizePhoneNumber(data.phoneNo) === normalizePhoneNumber(data.emergencyContact)) {
      ctx.addIssue({
        code: "custom",
        message: "Emergency contact must be different from phone number",
        path: ["emergencyContact"],
      });
    }

    const d = new Date(data.birthday);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date", path: ["birthday"] });
      return;
    }
    if (d.getTime() >= Date.now()) {
      ctx.addIssue({ code: "custom", message: "Birthday must be in the past", path: ["birthday"] });
    }
  });

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

function SectionTitle({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="bg-primary/10 text-primary rounded-lg p-2">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-foreground text-xl font-black tracking-tighter uppercase italic">{title}</h3>
    </div>
  );
}

export function MyAccountContent({ accountData }: MyAccountContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "history">("overview");
  const [purchasePage, setPurchasePage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reopeningPayment, setReopeningPayment] = useState<string | null>(null);
  const { isLoaded: isSnapLoaded, openSnap } = useMidtransSnap();
  const { refreshAfterPayment } = useMemberBookingCache();
  const cancelBookingMutation = useMemberCancelBooking();

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: accountData.user.name || "",
      phoneNo: accountData.user.phoneNo || "",
      emergencyContact: accountData.user.emergencyContact || "",
      birthday: accountData.user.birthday ? accountData.user.birthday.slice(0, 10) : "",
    },
  });

  const currentPurchases = accountData.purchaseHistory.slice(
    (purchasePage - 1) * ITEMS_PER_PAGE,
    purchasePage * ITEMS_PER_PAGE,
  );
  const currentAttendance = accountData.upcomingBookings.slice(
    (attendancePage - 1) * ITEMS_PER_PAGE,
    attendancePage * ITEMS_PER_PAGE,
  );

  const totalClasses = accountData.upcomingBookings.length;
  const thisMonth = accountData.upcomingBookings.filter((b) => {
    const d = new Date(b.classSession.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/public" });
  };

  const handleEdit = () => {
    form.reset({
      name: accountData.user.name || "",
      phoneNo: accountData.user.phoneNo || "",
      emergencyContact: accountData.user.emergencyContact || "",
      birthday: accountData.user.birthday ? accountData.user.birthday.slice(0, 10) : "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/public/my-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error("Update failed", { description: result.error || "Something went wrong. Please try again." });
        return;
      }
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong", { description: "Please try again later." });
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: User },
    { id: "attendance" as const, label: "Attendance", icon: Activity },
    { id: "history" as const, label: "Billing & History", icon: History },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="animate-fade-in-up container mx-auto px-4 py-8 sm:py-12 md:py-20">
        {/* Profile Header */}
        <div className="border-border bg-card relative mb-8 overflow-hidden rounded-3xl border p-6 shadow-xl md:p-10">
          <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row">
            <div className="relative">
              <div className="border-primary h-24 w-24 overflow-hidden rounded-full border-4 shadow-2xl md:h-32 md:w-32">
                {session?.user.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- user avatar from OAuth */
                  <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <span className="text-foreground text-2xl font-black md:text-3xl">
                      {(accountData.user.name && accountData.user.name.charAt(0)) || "?"}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-card absolute right-0 bottom-0 h-6 w-6 rounded-full border-4 bg-emerald-500" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-foreground mb-2 text-3xl font-black tracking-tighter uppercase italic md:text-5xl">
                {accountData.user.name ?? "Member"}
              </h2>
              <div className="text-muted-foreground flex flex-wrap justify-center gap-4 text-sm md:justify-start">
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Member ID: {accountData.user.id.slice(0, 8)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Joined {formatDate(accountData.user.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-4 w-4" /> Home Box: {APP_CONFIG.name}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="px-3" onClick={handleEdit}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-red-400/20 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Quick Grid */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-border bg-card rounded-2xl border p-6">
            <p className="text-muted-foreground mb-1 text-xs font-bold tracking-widest uppercase">Total Classes</p>
            <p className="text-primary text-3xl font-black">{totalClasses}</p>
          </div>
          <div className="border-border bg-card rounded-2xl border p-6">
            <p className="text-muted-foreground mb-1 text-xs font-bold tracking-widest uppercase">This Month</p>
            <p className="text-primary text-3xl font-black">{thisMonth}</p>
          </div>
          <div className="border-border bg-card rounded-2xl border p-6">
            <p className="text-muted-foreground mb-1 text-xs font-bold tracking-widest uppercase">WOD PB</p>
            <p className="text-primary text-3xl font-black">—</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Tab Navigation */}
          <div className="bg-secondary flex flex-row gap-2 overflow-x-auto rounded-xl p-1 lg:col-span-3 lg:flex-col lg:bg-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold tracking-wider whitespace-nowrap uppercase transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8 lg:col-span-9">
            {activeTab === "overview" && (
              <div className="animate-fade-in-up space-y-8">
                {/* Active Memberships */}
                <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
                  <SectionTitle title="Active Memberships" icon={CreditCard} />
                  {accountData.activeMemberships.length > 0 ? (
                    <div className="space-y-6">
                      {accountData.activeMemberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="border-border bg-background/50 flex flex-col items-start gap-6 rounded-xl border p-4 md:flex-row md:items-center md:justify-between md:p-6"
                        >
                          <div>
                            <Badge className="mb-2 bg-green-500/20 text-green-700 dark:text-green-300">
                              CURRENT PLAN
                            </Badge>
                            <h4 className="text-foreground text-2xl font-black md:text-3xl">
                              {membership.product.name}
                            </h4>
                            <p className="text-muted-foreground text-sm">
                              Renews on {formatDate(membership.expiredAt)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                              {membership.remainingQuota === null ? (
                                <span title="Unlimited">∞ Unlimited</span>
                              ) : (
                                <span>{membership.remainingQuota} sessions remaining</span>
                              )}
                            </p>
                            <p className="text-muted-foreground mt-2 text-sm">
                              Need to freeze this membership? Please contact admin to submit a freeze request.
                            </p>
                          </div>
                          <div className="w-full border-t pt-6 text-center md:w-auto md:border-t-0 md:border-l md:pt-0 md:pl-10 md:text-right">
                            <p className="text-foreground text-2xl font-black">
                              {formatPrice(membership.product.price)}
                            </p>
                            <p className="text-muted-foreground text-xs font-bold uppercase">
                              per {membership.product.validDays} days
                            </p>
                            <Button size="sm" variant="outline" className="mt-4 w-full md:w-auto" asChild>
                              <Link href="/public">Manage Billing</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : accountData.frozenMemberships.length > 0 ? (
                    <div className="space-y-4">
                      {accountData.frozenMemberships.map((membership) => (
                        <div
                          key={membership.id}
                          className="border-border bg-background/50 flex flex-col gap-2 rounded-xl border p-4"
                        >
                          <Badge variant="outline">FROZEN</Badge>
                          <h4 className="text-foreground text-xl font-black">{membership.product.name}</h4>
                          <p className="text-muted-foreground text-sm">Expires on {formatDate(membership.expiredAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4">
                      <p className="text-muted-foreground mb-4">You don&apos;t have an active membership.</p>
                      <Button asChild>
                        <Link href="/public">Browse Plans</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Membership History */}
                <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
                  <SectionTitle title="Membership History" icon={History} />
                  <div className="space-y-4">
                    {accountData.allMemberships.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No membership history yet.</p>
                    ) : (
                      accountData.allMemberships.map((m) => (
                        <div
                          key={m.id}
                          className="border-border bg-background/50 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
                        >
                          <div>
                            <p className="text-foreground font-bold">{m.product.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatDateShort(m.joinDate)} — {formatDateShort(m.expiredAt)}
                            </p>
                          </div>
                          <Badge
                            variant={m.status === "ACTIVE" ? "default" : "outline"}
                            className={
                              m.status === "ACTIVE" ? "bg-green-500/20 text-green-700 dark:text-green-300" : undefined
                            }
                          >
                            {m.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="animate-fade-in-up border-border bg-card rounded-2xl border p-6 md:p-8">
                <SectionTitle title="Attendance" icon={Activity} />
                <div className="grid grid-cols-1 gap-4">
                  {currentAttendance.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">No upcoming sessions.</p>
                  ) : (
                    currentAttendance.map((item) => (
                      <div
                        key={item.id}
                        className="group border-border bg-background/50 hover:border-primary/30 rounded-xl border p-4 transition-all"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-foreground font-bold">{item.classSession.item.name}</p>
                              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <Badge variant="secondary">{item.classSession.item.name}</Badge>
                                <span>•</span>
                                <span>{item.classSession.teacher?.name ?? "TBA"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-border flex items-center justify-between border-t pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0 sm:text-right">
                            <p className="text-foreground text-sm font-black">
                              {formatDateShort(item.classSession.date)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {item.classSession.startTime}
                              {item.classSession.endTime ? ` – ${item.classSession.endTime}` : ""}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 sm:mt-0"
                              onClick={() =>
                                cancelBookingMutation.mutate(item.id, {
                                  onSuccess: () => router.refresh(),
                                })
                              }
                              disabled={cancelBookingMutation.isPending || !item.canCancel}
                              title={item.canCancel ? undefined : "Cancellation is no longer allowed for this session."}
                            >
                              {cancelBookingMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <SimplePagination
                  total={accountData.upcomingBookings.length}
                  perPage={ITEMS_PER_PAGE}
                  current={attendancePage}
                  onChange={setAttendancePage}
                />
              </div>
            )}

            {activeTab === "history" && (
              <div className="animate-fade-in-up border-border bg-card rounded-2xl border p-6 md:p-8">
                <SectionTitle title="Recent Purchases" icon={CreditCard} />
                {accountData.purchaseHistory.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-sm">No purchases yet.</p>
                ) : (
                  <>
                    <div className="space-y-4 md:hidden">
                      {currentPurchases.map((inv) => (
                        <div key={inv.id} className="border-border bg-background/50 rounded-xl border p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <p className="text-foreground font-bold">{inv.product.name}</p>
                              {inv.timesBought !== null && (
                                <p className="text-muted-foreground text-xs">
                                  Bought {inv.timesBought}x
                                  {typeof inv.product.purchaseLimitPerUser === "number"
                                    ? ` / ${inv.product.purchaseLimitPerUser}x limit`
                                    : ""}
                                </p>
                              )}
                            </div>
                            <p className="text-primary font-black">{formatPrice(inv.amount)}</p>
                          </div>
                          <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <span>{formatDateShort(inv.createdAt)}</span>
                            <Badge variant="outline">{inv.id.slice(0, 8)}</Badge>
                          </div>
                          {inv.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() =>
                                handleReopenPayment(
                                  inv.id,
                                  setReopeningPayment,
                                  isSnapLoaded,
                                  openSnap,
                                  router,
                                  refreshAfterPayment,
                                )
                              }
                              disabled={reopeningPayment === inv.id}
                            >
                              {reopeningPayment === inv.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Opening...
                                </>
                              ) : (
                                "Continue Payment"
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-border cursor-pointer border-b">
                            <th className="text-muted-foreground pb-4 text-xs font-bold uppercase">Invoice</th>
                            <th className="text-muted-foreground pb-4 text-xs font-bold uppercase">Date</th>
                            <th className="text-muted-foreground pb-4 text-xs font-bold uppercase">Item</th>
                            <th className="text-muted-foreground pb-4 text-xs font-bold uppercase">Amount</th>
                            <th className="text-muted-foreground pb-4 text-right text-xs font-bold uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-border divide-y">
                          {currentPurchases.map((inv) => (
                            <tr key={inv.id} className="hover:bg-accent/30 cursor-pointer transition-colors">
                              <td className="text-foreground py-4 text-sm font-medium">{inv.id.slice(0, 12)}</td>
                              <td className="text-muted-foreground py-4 text-sm">{formatDateShort(inv.createdAt)}</td>
                              <td className="text-foreground py-4 text-sm font-bold">
                                <div className="space-y-0.5">
                                  <p>{inv.product.name}</p>
                                  {inv.timesBought !== null && (
                                    <p className="text-muted-foreground text-xs font-normal">
                                      Bought {inv.timesBought}x
                                      {typeof inv.product.purchaseLimitPerUser === "number"
                                        ? ` / ${inv.product.purchaseLimitPerUser}x limit`
                                        : ""}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="text-primary py-4 text-sm font-black">{formatPrice(inv.amount)}</td>
                              <td className="py-4 text-right">
                                {inv.status === "PENDING" ? (
                                  <button
                                    type="button"
                                    className="text-primary text-xs font-bold tracking-widest uppercase hover:underline"
                                    onClick={() =>
                                      handleReopenPayment(
                                        inv.id,
                                        setReopeningPayment,
                                        isSnapLoaded,
                                        openSnap,
                                        router,
                                        refreshAfterPayment,
                                      )
                                    }
                                    disabled={reopeningPayment === inv.id}
                                  >
                                    {reopeningPayment === inv.id ? "Opening..." : "Pay"}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <SimplePagination
                      total={accountData.purchaseHistory.length}
                      perPage={ITEMS_PER_PAGE}
                      current={purchasePage}
                      onChange={setPurchasePage}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <PublicDialogContent>
          <PublicDialogHeader>
            <PublicDialogTitle>Edit Profile</PublicDialogTitle>
            <PublicDialogDescription>
              Update your account information. Please contact admin for support.
            </PublicDialogDescription>
          </PublicDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <PublicDialogBody className="max-h-[60vh] space-y-4 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input id="name" type="text" placeholder="John Doe" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input id="phoneNo" type="tel" placeholder="+1234567890" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <Input
                          id="emergencyContact"
                          type="tel"
                          placeholder="+1234567890"
                          autoComplete="tel-national"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday</FormLabel>
                      <FormControl>
                        <BirthdayPicker
                          ref={field.ref}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Pick your birthday"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-muted rounded-lg p-4">
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        value={accountData.user.email || ""}
                        disabled
                        className="bg-background"
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">Contact admin to change email.</p>
                  </FormItem>
                </div>
              </PublicDialogBody>
              <PublicDialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Save Changes"}
                </Button>
              </PublicDialogFooter>
            </form>
          </Form>
        </PublicDialogContent>
      </Dialog>
    </div>
  );
}
