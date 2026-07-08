-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "sale_price" DECIMAL(10,2),
ADD COLUMN "discount_starts_at" TIMESTAMP(6),
ADD COLUMN "discount_ends_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "list_price" DECIMAL(10,2),
ADD COLUMN "product_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "promo_discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN "promo_code_id" UUID,
ADD COLUMN "promo_code" TEXT;

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "brand_id" UUID NOT NULL,
    "discount_type" "PromoDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount_amount" DECIMAL(10,2),
    "starts_at" TIMESTAMP(6),
    "ends_at" TIMESTAMP(6),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "applicable_product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promo_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_code_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_brand_id_code_key" ON "promo_codes"("brand_id", "code");

-- CreateIndex
CREATE INDEX "promo_codes_brand_id_is_active_idx" ON "promo_codes"("brand_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_redemptions_transaction_id_key" ON "promo_code_redemptions"("transaction_id");

-- CreateIndex
CREATE INDEX "promo_code_redemptions_promo_code_id_user_id_idx" ON "promo_code_redemptions"("promo_code_id", "user_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
