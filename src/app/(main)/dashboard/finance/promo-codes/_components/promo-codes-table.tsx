"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBrandsAdmin } from "@/hooks/use-brands-query";
import {
  useCreatePromoCode,
  useDeletePromoCode,
  usePromoCodes,
  useUpdatePromoCode,
  type PromoCode,
} from "@/hooks/use-promo-codes";
import { formatPrice } from "@/lib/utils";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  brandId: z.string().uuid("Select a brand"),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().positive("Value must be positive"),
  maxDiscountAmount: z.coerce.number().positive().nullable().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

function formatDiscount(promo: PromoCode) {
  if (promo.discountType === "PERCENT") {
    return `${promo.discountValue}%`;
  }
  return formatPrice(promo.discountValue);
}

function PromoCodeFormDialog({
  promo,
  open,
  onOpenChange,
  trigger,
}: {
  promo?: PromoCode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const isEdit = !!promo;
  const createMutation = useCreatePromoCode();
  const updateMutation = useUpdatePromoCode();
  const { data: brands = [] } = useBrandsAdmin();
  const activeBrands = brands.filter((b) => b.isActive);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      brandId: "",
      discountType: "PERCENT",
      discountValue: 10,
      maxDiscountAmount: null,
      startsAt: "",
      endsAt: "",
      usageLimit: null,
      perUserLimit: 1,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (promo) {
      form.reset({
        code: promo.code,
        brandId: promo.brandId,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxDiscountAmount: promo.maxDiscountAmount,
        startsAt: promo.startsAt ? format(new Date(promo.startsAt), "yyyy-MM-dd'T'HH:mm") : "",
        endsAt: promo.endsAt ? format(new Date(promo.endsAt), "yyyy-MM-dd'T'HH:mm") : "",
        usageLimit: promo.usageLimit,
        perUserLimit: promo.perUserLimit,
        isActive: promo.isActive,
      });
    } else {
      form.reset({
        code: "",
        brandId: activeBrands.length === 1 ? activeBrands[0].id : "",
        discountType: "PERCENT",
        discountValue: 10,
        maxDiscountAmount: null,
        startsAt: "",
        endsAt: "",
        usageLimit: null,
        perUserLimit: 1,
        isActive: true,
      });
    }
  }, [open, promo, form, activeBrands]);

  const mutation = isEdit ? updateMutation : createMutation;

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      maxDiscountAmount: values.maxDiscountAmount ?? null,
      usageLimit: values.usageLimit ?? null,
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      applicableProductIds: promo?.applicableProductIds ?? [],
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: promo.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onOpenChange?.(false);
  }

  const content = (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit promo code" : "Create promo code"}</DialogTitle>
        <DialogDescription>Promo codes apply on top of any active product sale price.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="SAVE20" {...field} className="uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENT">Percent</SelectItem>
                      <SelectItem value="FIXED">Fixed (IDR)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {form.watch("discountType") === "PERCENT" ? (
            <FormField
              control={form.control}
              name="maxDiscountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max discount (IDR, optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Global usage limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="perUserLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Per-user limit</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
}

export function PromoCodesTable() {
  const { data: promoCodes = [], isLoading } = usePromoCodes();
  const deleteMutation = useDeletePromoCode();
  const [editPromo, setEditPromo] = React.useState<PromoCode | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PromoCodeFormDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add promo code
            </Button>
          }
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  No promo codes yet.
                </TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-mono font-semibold">{promo.code}</TableCell>
                  <TableCell>{promo.brand?.name ?? "-"}</TableCell>
                  <TableCell>{formatDiscount(promo)}</TableCell>
                  <TableCell>
                    {promo.usageCount}
                    {promo.usageLimit != null ? ` / ${promo.usageLimit}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {promo.startsAt ? format(new Date(promo.startsAt), "dd MMM yyyy") : "—"} –{" "}
                    {promo.endsAt ? format(new Date(promo.endsAt), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={promo.isActive ? "success" : "secondary"}>
                      {promo.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditPromo(promo);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(promo.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PromoCodeFormDialog promo={editPromo} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
