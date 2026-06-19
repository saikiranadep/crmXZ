-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "deleted" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "users_deleted_idx" ON "public"."users"("deleted");
