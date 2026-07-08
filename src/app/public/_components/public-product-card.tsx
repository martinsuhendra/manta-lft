"use client";

import * as React from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ProductPriceDisplay } from "@/components/product-price-display";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMemberBookingCache } from "@/hooks/use-member-booking-cache";
import { resolveProductPricing } from "@/lib/checkout-pricing";
import { useMidtransSnap } from "@/lib/hooks/use-midtrans-snap";
import { formatPrice } from "@/lib/utils";

import {
  Dialog,
  DialogTrigger,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
} from "./public-dialog";
import { SignUpDialog } from "./sign-up-dialog";

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  salePrice?: number | null;
  finalPrice?: number;
  isOnSale?: boolean;
  discountLabel?: string | null;
  validDays: number;
  image: string | null;
  paymentUrl: string | null;
  whatIsIncluded: string | null;
  features: string[];
  createdAt: string;
}

interface PromoPreview {
  listPrice: number;
  productDiscountAmount: number;
  promoDiscountAmount: number;
  finalAmount: number;
  promoCode: string | null;
}

interface PublicProductCardProps {
  product: PublicProduct;
}

const purchaseFormSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email address"),
  customerName: z.string().min(1, "Name is required"),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export function PublicProductCard({ product }: PublicProductCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [promoInput, setPromoInput] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null);
  const [promoPreview, setPromoPreview] = React.useState<PromoPreview | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { data: session } = useSession();

  // Defer Dialog rendering until after mount to avoid Radix useId() hydration mismatch
  // when multiple Dialogs render in a grid (different IDs on server vs client)
  React.useEffect(() => setMounted(true), []);
  const router = useRouter();
  const { isLoaded: isSnapLoaded, openSnap } = useMidtransSnap();
  const { refreshAfterPayment } = useMemberBookingCache();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      customerEmail: "",
      customerName: "",
    },
  });

  // Auto-fill form when dialog opens and user is signed in
  React.useEffect(() => {
    if (isDialogOpen && session?.user) {
      form.reset({
        customerName: session.user.name || "",
        customerEmail: session.user.email || "",
      });
    } else if (isDialogOpen && !session?.user) {
      form.reset({
        customerEmail: "",
        customerName: "",
      });
    }
  }, [isDialogOpen, session, form]);

  const listPrice = product.price;
  const productFinalPrice = product.finalPrice ?? product.price;

  const salePrice = product.salePrice ?? null;
  const hasConfiguredSale = salePrice != null && salePrice < listPrice;
  const configuredSalePricing = hasConfiguredSale ? resolveProductPricing({ price: listPrice, salePrice }) : null;
  const displayIsOnSale = Boolean(configuredSalePricing?.isOnSale);
  const displayFinalPrice = configuredSalePricing?.priceAfterProduct ?? productFinalPrice;
  const displayDiscountLabel = configuredSalePricing?.discountLabel ?? product.discountLabel;

  const checkoutTotal = promoPreview?.finalAmount ?? productFinalPrice;
  const isFreeCheckout = checkoutTotal === 0;

  React.useEffect(() => {
    if (!isDialogOpen) {
      setPromoInput("");
      setAppliedPromo(null);
      setPromoPreview(null);
    }
  }, [isDialogOpen]);

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setIsApplyingPromo(true);
    try {
      const response = await fetch("/api/public/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, promoCode: code }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Invalid promo code");
        setAppliedPromo(null);
        setPromoPreview(null);
        return;
      }
      setAppliedPromo(result.promoCode);
      setPromoPreview({
        listPrice: result.listPrice,
        productDiscountAmount: result.productDiscountAmount,
        promoDiscountAmount: result.promoDiscountAmount,
        finalAmount: result.finalAmount,
        promoCode: result.promoCode,
      });
      toast.success("Promo applied");
    } catch {
      toast.error("Failed to validate promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handlePurchase = async (data: PurchaseFormValues) => {
    setIsPurchasing(true);
    try {
      const response = await fetch("/api/public/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          promoCode: appliedPromo ?? undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Purchase failed", {
          description: result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      // Close dialog and open Snap payment
      setIsDialogOpen(false);
      form.reset();

      if (result.isFreePurchase) {
        await refreshAfterPayment(result.transaction?.id);
        toast.success("Membership activated!", {
          description: "Your free trial is active immediately.",
        });
        router.push("/public/my-account");
        return;
      }

      // Check if Snap is loaded
      if (!isSnapLoaded) {
        toast.error("Payment gateway not ready", {
          description: "Please wait a moment and try again.",
        });
        return;
      }

      // Open Snap payment popup
      if (result.snapToken) {
        openSnap(result.snapToken, {
          onSuccess: async () => {
            await refreshAfterPayment(result.transaction?.id);
            toast.success("Payment successful!", {
              description: "Your membership has been activated.",
            });
            router.push("/public/my-account");
          },
          onPending: async () => {
            await refreshAfterPayment(result.transaction?.id);
            toast.info("Payment pending", {
              description: "Waiting for payment confirmation. You can check the status in My Account.",
            });
            router.push("/public/my-account");
          },
          onError: () => {
            toast.error("Payment failed", {
              description: "Please try again or contact support.",
            });
          },
          onClose: () => {
            // User closed the popup
            toast.info("Payment cancelled", {
              description: "You can continue the payment from My Account.",
            });
          },
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="group border-brand-primary hover:border-brand-accent shadow-brand-accent/5 hover:shadow-brand-primary/10 relative flex h-full flex-col overflow-hidden border-r-4 border-b-4 bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="bg-brand-accent/5 relative aspect-[16/10] w-full overflow-hidden">
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
            />
            <div
              className="bg-brand-primary/10 absolute inset-0 transition-colors duration-300 group-hover:bg-transparent"
              aria-hidden
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="text-brand-accent/30 h-14 w-14 opacity-50" />
          </div>
        )}
        <div className="bg-brand-primary absolute bottom-0 left-0 px-6 py-2 text-sm font-black text-white uppercase italic">
          {product.validDays} days
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 md:p-10">
        <h3 className="text-brand-accent mb-3 text-xl font-black tracking-tighter uppercase italic sm:mb-4 sm:text-2xl md:text-3xl">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-brand-accent/65 mb-4 line-clamp-2 text-sm leading-relaxed font-medium sm:mb-6 md:mb-8 md:line-clamp-none md:text-base">
            {product.description}
          </p>
        )}

        <div className="mb-4 flex items-baseline justify-between gap-2 sm:mb-6 md:mb-8">
          <ProductPriceDisplay
            listPrice={listPrice}
            finalPrice={displayFinalPrice}
            isOnSale={displayIsOnSale}
            discountLabel={displayDiscountLabel}
            size="lg"
            className="text-brand-accent [&_span]:text-brand-accent"
          />
        </div>

        {product.features.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-6 md:mb-8 md:gap-2">
            {product.features.map((feature) => (
              <span
                key={feature}
                className="border-brand-accent/15 bg-brand-primary/8 text-brand-accent truncate border px-2 py-0.5 text-[9px] font-black tracking-widest uppercase sm:px-3 sm:py-1 sm:text-[10px]"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {product.whatIsIncluded && (
          <div className="border-brand-accent/15 mb-6 border-t pt-4 md:mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-accent/60 hover:text-brand-accent -ml-2 h-auto p-0 text-xs font-semibold tracking-wider uppercase hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              What&apos;s included
              {isExpanded ? (
                <span className="ml-1.5 text-[10px]">▲</span>
              ) : (
                <span className="ml-1.5 text-[10px]">▼</span>
              )}
            </Button>
            {isExpanded && (
              <div
                className="text-brand-accent/65 prose prose-sm mt-3 max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: product.whatIsIncluded }}
              />
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          {!mounted ? (
            <Button
              className="text-brand-primary flex items-center gap-4 font-black tracking-widest uppercase hover:gap-6"
              variant="ghost"
              disabled
            >
              Purchase Now <ArrowRight className="h-5 w-5" />
            </Button>
          ) : !session ? (
            <SignUpDialog>
              <Button
                className="text-brand-primary flex items-center gap-4 font-black tracking-widest uppercase transition-all hover:gap-6"
                variant="ghost"
              >
                Purchase Now <ArrowRight className="h-5 w-5" />
              </Button>
            </SignUpDialog>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="text-brand-primary flex w-full items-center justify-center gap-4 font-black tracking-widest uppercase transition-all hover:gap-6"
                  variant="ghost"
                >
                  Purchase Now <ArrowRight className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <PublicDialogContent>
                <PublicDialogHeader>
                  <PublicDialogTitle>Purchase {product.name}</PublicDialogTitle>
                  <PublicDialogDescription>
                    Enter your information to complete your membership purchase and continue with payment.
                  </PublicDialogDescription>
                </PublicDialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handlePurchase)}>
                    <PublicDialogBody className="space-y-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" disabled={!!session.user} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" disabled={!!session.user} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Promo code"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                            disabled={isPurchasing}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyPromo}
                            disabled={isApplyingPromo || isPurchasing || !promoInput.trim()}
                          >
                            {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                          </Button>
                        </div>
                        <div className="bg-muted space-y-2 rounded-lg p-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">List price</span>
                            <span>{formatPrice(promoPreview?.listPrice ?? listPrice)}</span>
                          </div>
                          {(promoPreview?.productDiscountAmount ?? 0) > 0 ||
                          (product.isOnSale && productFinalPrice < listPrice) ? (
                            <div className="flex justify-between text-green-700 dark:text-green-400">
                              <span>Product discount</span>
                              <span>
                                -{formatPrice(promoPreview?.productDiscountAmount ?? listPrice - productFinalPrice)}
                              </span>
                            </div>
                          ) : null}
                          {(promoPreview?.promoDiscountAmount ?? 0) > 0 ? (
                            <div className="flex justify-between text-green-700 dark:text-green-400">
                              <span>Promo{appliedPromo ? ` (${appliedPromo})` : ""}</span>
                              <span>-{formatPrice(promoPreview!.promoDiscountAmount)}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center justify-between border-t pt-2 font-bold">
                            <span>Total</span>
                            <span className="text-lg">{formatPrice(checkoutTotal)}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Valid for {product.validDays} days from purchase date
                        </p>
                      </div>
                    </PublicDialogBody>
                    <PublicDialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isPurchasing}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPurchasing || (!isFreeCheckout && !isSnapLoaded)}>
                        {isPurchasing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : !isFreeCheckout && !isSnapLoaded ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading Payment...
                          </>
                        ) : !isFreeCheckout ? (
                          "Continue to Payment"
                        ) : (
                          "Activate Free Trial"
                        )}
                      </Button>
                    </PublicDialogFooter>
                  </form>
                </Form>
              </PublicDialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
