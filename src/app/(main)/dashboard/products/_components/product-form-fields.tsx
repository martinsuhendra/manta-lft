"use client";

import * as React from "react";

import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBrandsAdmin } from "@/hooks/use-brands-query";
import { CloudinaryAssetPayload } from "@/lib/cloudinary-asset";
import { CLOUDINARY_UPLOAD_TARGETS } from "@/lib/cloudinary-validation";

interface FormData {
  brandIds: string[];
  name: string;
  description?: string;
  price: number;
  validDays: number;
  participantsPerPurchase: number;
  isPurchaseUnlimited: boolean;
  purchaseLimitPerUser?: number | null;
  features: string[];
  image?: string;
  imageAsset?: CloudinaryAssetPayload | null;
  paymentUrl?: string;
  whatIsIncluded?: string;
  isActive: boolean;
  isPublic: boolean;
  isOnSale: boolean;
  salePrice?: number | null;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
}

interface ProductFormFieldsProps {
  form: UseFormReturn<FormData>;
  mutation: { isPending: boolean };
  isEdit: boolean;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  hideButtons?: boolean;
}

export function ProductFormFields({
  form,
  mutation,
  isEdit,
  onSubmit,
  onCancel,
  hideButtons = false,
}: ProductFormFieldsProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const { data: brands = [] } = useBrandsAdmin();
  const activeBrands = React.useMemo(() => brands.filter((brand) => brand.isActive), [brands]);
  const isPurchaseUnlimited = form.watch("isPurchaseUnlimited");
  const isOnSale = form.watch("isOnSale");
  const listPrice = form.watch("price") || 0;

  React.useEffect(() => {
    if (activeBrands.length !== 1) return;
    const onlyId = activeBrands[0].id;
    const current = form.getValues("brandIds");
    if (current.length === 1 && current[0] === onlyId) return;
    form.setValue("brandIds", [onlyId], { shouldValidate: true, shouldDirty: false });
  }, [activeBrands, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
        <FormField
          control={form.control}
          name="brandIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brands</FormLabel>
              <FormControl>
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
                  {activeBrands.map((brand) => (
                    <div key={brand.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        aria-label={`Select brand ${brand.name}`}
                        checked={field.value.includes(brand.id)}
                        disabled={mutation.isPending}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, brand.id]);
                            return;
                          }
                          field.onChange(field.value.filter((id) => id !== brand.id));
                        }}
                      />
                      <span>{brand.name}</span>
                    </div>
                  ))}
                  {!activeBrands.length && <p className="text-muted-foreground text-sm">No active brands available.</p>}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Premium Membership" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Access to all premium features and unlimited classes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onAssetChange={(asset) => form.setValue("imageAsset", asset ?? null)}
                  onUploadStateChange={setIsUploading}
                  uploadTarget={CLOUDINARY_UPLOAD_TARGETS.PRODUCT_IMAGE}
                  disabled={mutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatIsIncluded"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What&apos;s Included?</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe what's included in this product..."
                  disabled={mutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (IDR)</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="Enter price in IDR"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Days</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="participantsPerPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Participants per purchase</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={mutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Session slots consumed per booking (e.g. 2 for couple packages)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4 rounded-md border p-4">
          <FormField
            control={form.control}
            name="isOnSale"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={mutation.isPending}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      field.onChange(isChecked);
                      if (!isChecked) {
                        form.setValue("salePrice", null);
                        form.setValue("discountStartsAt", null);
                        form.setValue("discountEndsAt", null);
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>On sale</FormLabel>
                  <p className="text-muted-foreground text-sm">
                    Offer a discounted sale price. List price stays as the compare-at price.
                  </p>
                </div>
              </FormItem>
            )}
          />
          {isOnSale ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale price (IDR)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        placeholder="Enter sale price"
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountStartsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale starts (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountEndsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale ends (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {typeof form.watch("salePrice") === "number" && form.watch("salePrice")! < listPrice ? (
                <p className="text-muted-foreground col-span-full text-sm">
                  Customers pay {Math.round(((listPrice - (form.watch("salePrice") ?? 0)) / listPrice) * 100)}% less
                  than list price.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-4 rounded-md border p-4">
          <FormField
            control={form.control}
            name="isPurchaseUnlimited"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={mutation.isPending}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      field.onChange(isChecked);
                      if (isChecked) form.setValue("purchaseLimitPerUser", null);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Unlimited purchases per user</FormLabel>
                  <p className="text-muted-foreground text-sm">
                    If disabled, each user can only buy this product up to the configured limit.
                  </p>
                </div>
              </FormItem>
            )}
          />
          {!isPurchaseUnlimited && (
            <FormField
              control={form.control}
              name="purchaseLimitPerUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase limit per user</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 1"
                      value={field.value ?? ""}
                      onChange={(event) => {
                        if (event.target.value === "") return field.onChange(null);
                        const parsed = Number.parseInt(event.target.value, 10);
                        field.onChange(Number.isNaN(parsed) ? null : parsed);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active Product</FormLabel>
                <p className="text-muted-foreground text-sm">Active products are available for purchase by users</p>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Visible in Customer Dashboard</FormLabel>
                <p className="text-muted-foreground text-sm">
                  Hide this product from shop/customer pages while keeping it available in admin dashboard.
                </p>
              </div>
            </FormItem>
          )}
        />
        {!hideButtons && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || isUploading}>
              {mutation.isPending
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isUploading
                  ? "Uploading..."
                  : isEdit
                    ? "Update Product"
                    : "Create Product"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
