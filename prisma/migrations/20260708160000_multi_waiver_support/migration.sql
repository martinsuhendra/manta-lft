-- Rename waiver_settings to waivers and add multi-waiver columns
ALTER TABLE "public"."waiver_settings" RENAME TO "waivers";

ALTER TABLE "public"."waivers"
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

UPDATE "public"."waivers"
SET "name" = CASE
  WHEN "key" = 'GLOBAL' THEN 'General waiver'
  ELSE COALESCE("key", 'Waiver')
END
WHERE "name" IS NULL;

ALTER TABLE "public"."waivers"
ALTER COLUMN "name" SET NOT NULL;

DROP INDEX IF EXISTS "public"."waiver_settings_key_key";

ALTER TABLE "public"."waivers"
DROP COLUMN IF EXISTS "key";

-- Create per-user waiver acceptance records
CREATE TABLE IF NOT EXISTS "public"."user_waiver_acceptances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "waiver_id" UUID NOT NULL,
    "accepted_version" INTEGER NOT NULL,
    "accepted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_ip" TEXT,
    "accepted_user_agent" TEXT,

    CONSTRAINT "user_waiver_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_waiver_acceptances_user_id_waiver_id_key"
ON "public"."user_waiver_acceptances"("user_id", "waiver_id");

CREATE INDEX IF NOT EXISTS "user_waiver_acceptances_waiver_id_idx"
ON "public"."user_waiver_acceptances"("waiver_id");

ALTER TABLE "public"."user_waiver_acceptances"
ADD CONSTRAINT "user_waiver_acceptances_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."user_waiver_acceptances"
ADD CONSTRAINT "user_waiver_acceptances_waiver_id_fkey"
FOREIGN KEY ("waiver_id") REFERENCES "public"."waivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy single-waiver acceptance data
INSERT INTO "public"."user_waiver_acceptances" (
    "user_id",
    "waiver_id",
    "accepted_version",
    "accepted_at",
    "accepted_ip",
    "accepted_user_agent"
)
SELECT
    u."id",
    w."id",
    u."waiver_accepted_version",
    COALESCE(u."waiver_accepted_at", CURRENT_TIMESTAMP),
    u."waiver_accepted_ip",
    u."waiver_accepted_user_agent"
FROM "public"."users" u
CROSS JOIN LATERAL (
    SELECT w2."id"
    FROM "public"."waivers" w2
    ORDER BY w2."sort_order" ASC, w2."created_at" ASC
    LIMIT 1
) w
WHERE u."waiver_accepted_version" IS NOT NULL
ON CONFLICT ("user_id", "waiver_id") DO NOTHING;

-- Drop legacy user waiver columns
ALTER TABLE "public"."users"
DROP COLUMN IF EXISTS "waiver_accepted_at",
DROP COLUMN IF EXISTS "waiver_accepted_version",
DROP COLUMN IF EXISTS "waiver_accepted_ip",
DROP COLUMN IF EXISTS "waiver_accepted_user_agent";
