import { z } from "zod";

export const productDiscountFieldsSchema = z.object({
  salePrice: z.number().min(0, "Sale price must be at least 0").nullable().optional(),
  discountStartsAt: z.string().nullable().optional(),
  discountEndsAt: z.string().nullable().optional(),
});

export function refineProductDiscount<T extends { price: number; salePrice?: number | null }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.salePrice == null) return;
  if (data.salePrice > data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Sale price cannot be higher than list price",
      path: ["salePrice"],
    });
  }
}

export function parseOptionalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
