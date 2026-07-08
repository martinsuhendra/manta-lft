/* eslint-disable max-lines */
"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, ChevronsUpDown, CreditCard, Loader2, Package, User, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMidtransSnap } from "@/lib/hooks/use-midtrans-snap";
import { unwrapUsersListResponse } from "@/lib/users-api";
import { cn } from "@/lib/utils";

import { Member } from "./schema";

const purchaseSchema = z.object({
  userId: z.string().uuid().optional(),
  productId: z.string().uuid("Please select a membership product"),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerName: z.string().min(1, "Name is required").optional(),
  customerPhone: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface PurchaseMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember?: Member | null;
}

export function PurchaseMembershipDialog({ open, onOpenChange, selectedMember }: PurchaseMembershipDialogProps) {
  const queryClient = useQueryClient();
  const { isLoaded: isSnapLoaded, openSnap } = useMidtransSnap();
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [showCreateMember, setShowCreateMember] = React.useState(false);
  const [memberComboboxOpen, setMemberComboboxOpen] = React.useState(false);
  const [productComboboxOpen, setProductComboboxOpen] = React.useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      userId: undefined,
      productId: "",
      customerEmail: "",
      customerName: "",
      customerPhone: "",
    },
  });

  // Fetch members for search
  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axios.get("/api/users", { params: { limit: 500 } });
      return unwrapUsersListResponse(response.data);
    },
    enabled: open && !selectedMember,
  });

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("/api/public/products");
      return response.data;
    },
    enabled: open,
  });

  // Reset form when dialog opens/closes or selectedMember changes
  React.useEffect(() => {
    if (open) {
      if (selectedMember) {
        form.reset({
          userId: selectedMember.id,
          productId: "",
          customerEmail: selectedMember.email || "",
          customerName: selectedMember.name || "",
          customerPhone: selectedMember.phoneNo || "",
        });
        setShowCreateMember(false);
      } else {
        form.reset({
          userId: undefined,
          productId: "",
          customerEmail: "",
          customerName: "",
          customerPhone: "",
        });
        setShowCreateMember(false);
        setMemberComboboxOpen(false);
        setProductComboboxOpen(false);
      }
    }
  }, [open, selectedMember, form]);

  const selectedUserId = form.watch("userId");
  const selectedMemberData = members.find((m) => m.id === selectedUserId);
  const selectedProductId = form.watch("productId");
  const selectedProduct = products.find(
    (p: { id: string; finalPrice?: number; price: number }) => p.id === selectedProductId,
  );
  const selectedProductPrice = selectedProduct ? Number(selectedProduct.finalPrice ?? selectedProduct.price) : 0;

  const handlePurchase = async (data: PurchaseFormValues) => {
    setIsPurchasing(true);
    try {
      const response = await axios.post("/api/admin/purchase", {
        userId: data.userId,
        productId: data.productId,
        customerEmail: data.userId ? undefined : data.customerEmail,
        customerName: data.userId ? undefined : data.customerName,
        customerPhone: data.userId ? undefined : data.customerPhone,
      });

      const result = response.data;

      if (!response.data.success) {
        toast.error("Purchase failed", {
          description: result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      if (result.isFreePurchase) {
        toast.success("Membership activated", {
          description: "Free-trial membership is active immediately.",
        });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["memberships"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        onOpenChange(false);
        form.reset();
        return;
      }

      // Check if Snap is loaded
      if (!isSnapLoaded) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.");
        return;
      }

      if (!result.snapToken) {
        toast.error("Failed to initialize payment", {
          description: "Payment token was not generated. Please try again.",
        });
        return;
      }

      // Open Midtrans Snap
      openSnap(result.snapToken, {
        onSuccess: (paymentResult) => {
          console.log("Payment success:", paymentResult);
          toast.success("Payment successful!", {
            description: "Membership has been activated.",
          });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["memberships"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          onOpenChange(false);
          form.reset();
        },
        onPending: (paymentResult) => {
          console.log("Payment pending:", paymentResult);
          toast.info("Payment is pending", {
            description: "Your payment is being processed. Membership will be activated once payment is confirmed.",
          });
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["memberships"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          onOpenChange(false);
          form.reset();
        },
        onError: (paymentResult) => {
          console.error("Payment error:", paymentResult);
          toast.error("Payment failed", {
            description: paymentResult.status_message || "Something went wrong with the payment.",
          });
        },
        onClose: () => {
          console.log("Payment popup closed");
          // Don't close dialog, let user retry
        },
      });
    } catch (error) {
      console.error("Purchase error:", error);
      if (axios.isAxiosError(error)) {
        toast.error("Purchase failed", {
          description: error.response?.data?.error || "Something went wrong. Please try again.",
        });
      } else {
        toast.error("Purchase failed", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Membership</DialogTitle>
          <DialogDescription>
            Select a member and membership product to create a purchase transaction.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-6">
            {/* Member Selection */}
            {!selectedMember && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Member</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateMember(!showCreateMember);
                      if (!showCreateMember) {
                        form.setValue("userId", undefined);
                        form.setValue("customerEmail", "");
                        form.setValue("customerName", "");
                        form.setValue("customerPhone", "");
                      }
                    }}
                  >
                    {showCreateMember ? (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Select Existing
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create New
                      </>
                    )}
                  </Button>
                </div>

                {showCreateMember ? (
                  // Create new member form
                  <div className="space-y-4 rounded-lg border p-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter member name" {...field} />
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
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div>
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Select Member</FormLabel>
                          <Popover open={memberComboboxOpen} onOpenChange={setMemberComboboxOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "h-auto w-full justify-between py-3",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {selectedMemberData ? (
                                    <div className="flex items-center gap-2">
                                      <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                                        <User className="h-3 w-3" />
                                      </div>
                                      <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium">
                                          {selectedMemberData.name || "No Name"}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          {selectedMemberData.email}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span>Select a member...</span>
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search by name, email, or phone..." />
                                <CommandList>
                                  <CommandEmpty>No members found.</CommandEmpty>
                                  <CommandGroup>
                                    {members.map((member) => (
                                      <CommandItem
                                        key={member.id}
                                        value={`${member.name || ""} ${member.email || ""} ${member.phoneNo || ""}`}
                                        onSelect={() => {
                                          field.onChange(member.id);
                                          form.setValue("customerEmail", member.email || "");
                                          form.setValue("customerName", member.name || "");
                                          form.setValue("customerPhone", member.phoneNo || "");
                                          setMemberComboboxOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === member.id ? "opacity-100" : "opacity-0",
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium">{member.name || "No Name"}</span>
                                          <span className="text-muted-foreground text-xs">{member.email}</span>
                                          {member.phoneNo && (
                                            <span className="text-muted-foreground text-xs">{member.phoneNo}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Selected member info (if pre-selected) */}
            {selectedMember && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedMember.name || "No name"}</p>
                    <p className="text-muted-foreground text-sm">{selectedMember.email}</p>
                    {selectedMember.phoneNo && (
                      <p className="text-muted-foreground text-sm">{selectedMember.phoneNo}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Membership Product *</FormLabel>
                  <Popover open={productComboboxOpen} onOpenChange={setProductComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn("h-auto w-full justify-between py-3", !field.value && "text-muted-foreground")}
                          disabled={isLoadingProducts}
                        >
                          {selectedProduct ? (
                            <div className="flex items-center gap-2">
                              <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                                <Package className="h-3 w-3" />
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">{selectedProduct.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                  }).format(selectedProductPrice)}{" "}
                                  • Valid for {selectedProduct.validDays} days
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span>{isLoadingProducts ? "Loading products..." : "Select a product..."}</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search products by name..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingProducts ? "Loading..." : "No active products available"}
                          </CommandEmpty>
                          <CommandGroup>
                            {products.map((product: { id: string; name: string; price: number; validDays: number }) => (
                              <CommandItem
                                key={product.id}
                                value={`${product.name} ${product.price} ${product.validDays}`}
                                onSelect={() => {
                                  field.onChange(product.id);
                                  setProductComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === product.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{product.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                      minimumFractionDigits: 0,
                                    }).format(product.price)}{" "}
                                    • Valid for {product.validDays} days
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Summary */}
            {selectedProduct && (
              <div className="bg-muted/50 rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(selectedProductPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid for:</span>
                    <span className="font-medium">{selectedProduct.validDays} days</span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPurchasing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPurchasing}>
                {isPurchasing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
