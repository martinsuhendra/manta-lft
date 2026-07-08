import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { productDiscountFieldsSchema, refineProductDiscount } from "@/lib/product-discount-schema";

export const formSchema = z
  .object({
    brandIds: z.array(z.string().uuid("Invalid brand ID")).min(1, "Select at least one brand"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be at least 0"),
    validDays: z.coerce.number().positive("Valid days must be positive"),
    participantsPerPurchase: z.coerce.number().int().min(1, "Must be at least 1").max(10, "Must be at most 10"),
    isPurchaseUnlimited: z.boolean().default(true),
    purchaseLimitPerUser: z.coerce.number().int().min(1, "Must be at least 1").nullable().optional(),
    features: z.array(z.string()).default([]),
    image: z.string().optional(),
    paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    whatIsIncluded: z.string().optional(),
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),
    isOnSale: z.boolean().default(false),
  })
  .merge(productDiscountFieldsSchema)
  .superRefine((data, ctx) => {
    if (data.isOnSale) {
      refineProductDiscount({ price: data.price, salePrice: data.salePrice ?? null }, ctx);
      if (data.salePrice == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sale price is required when product is on sale",
          path: ["salePrice"],
        });
      }
    }
    if (data.isPurchaseUnlimited) return;
    if (typeof data.purchaseLimitPerUser === "number" && data.purchaseLimitPerUser >= 1) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Purchase limit per user is required when unlimited is disabled",
      path: ["purchaseLimitPerUser"],
    });
  });

export type FormData = z.infer<typeof formSchema>;

export const DEFAULT_FORM_VALUES: FormData = {
  brandIds: [],
  name: "",
  description: "",
  price: 0,
  validDays: 30,
  participantsPerPurchase: 1,
  isPurchaseUnlimited: true,
  purchaseLimitPerUser: null,
  features: [],
  image: "",
  paymentUrl: "",
  whatIsIncluded: "",
  isActive: true,
  isPublic: true,
  isOnSale: false,
  salePrice: null,
  discountStartsAt: null,
  discountEndsAt: null,
};

function fromDatetimeLocalValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapFormDataToApiPayload(data: FormData) {
  const { isOnSale, salePrice, discountStartsAt, discountEndsAt, ...rest } = data;
  return {
    ...rest,
    salePrice: isOnSale ? (salePrice ?? null) : null,
    discountStartsAt: isOnSale ? fromDatetimeLocalValue(discountStartsAt ?? null) : null,
    discountEndsAt: isOnSale ? fromDatetimeLocalValue(discountEndsAt ?? null) : null,
  };
}

export function toDatetimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function useFormValidation(form: UseFormReturn<FormData>) {
  const hasBasicErrors = () => {
    const errors = form.formState.errors;
    return !!(
      errors.brandIds ||
      errors.name ||
      errors.price ||
      errors.validDays ||
      errors.isPurchaseUnlimited ||
      errors.purchaseLimitPerUser ||
      errors.salePrice
    );
  };

  return { hasBasicErrors };
}
