-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "assigned_attorney_id" TEXT,
ADD COLUMN     "assigned_internal_staff_id" TEXT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reads" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_case_id_idx" ON "messages"("case_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "message_reads_message_id_idx" ON "message_reads"("message_id");

-- CreateIndex
CREATE INDEX "message_reads_user_id_idx" ON "message_reads"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_message_id_user_id_key" ON "message_reads"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "cases_assigned_attorney_id_idx" ON "cases"("assigned_attorney_id");

-- CreateIndex
CREATE INDEX "cases_assigned_internal_staff_id_idx" ON "cases"("assigned_internal_staff_id");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_attorney_id_fkey" FOREIGN KEY ("assigned_attorney_id") REFERENCES "attorneys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_internal_staff_id_fkey" FOREIGN KEY ("assigned_internal_staff_id") REFERENCES "internal_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
