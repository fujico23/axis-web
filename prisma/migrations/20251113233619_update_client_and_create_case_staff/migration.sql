/*
  Warnings:

  - You are about to drop the column `customer_identifier` on the `clients` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customer_number]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_number` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrademarkType" AS ENUM ('TEXT', 'LOGO');

-- CreateEnum
CREATE TYPE "ConsultationRoute" AS ENUM ('AI_SELF_SERVICE', 'ATTORNEY_CONSULTATION');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'TRADEMARK_REGISTERED', 'PRELIMINARY_RESEARCH_IN_PROGRESS', 'RESEARCH_RESULT_SHARED', 'PREPARING_APPLICATION', 'APPLICATION_CONFIRMED', 'APPLICATION_SUBMITTED', 'UNDER_EXAMINATION', 'OA_RECEIVED', 'RESPONDING_TO_OA', 'FINAL_RESULT_RECEIVED', 'PAYING_REGISTRATION_FEE', 'REGISTRATION_COMPLETED', 'AWAITING_RENEWAL', 'IN_DISPUTE', 'REJECTED', 'ABANDONED');

-- DropIndex
DROP INDEX "clients_customer_identifier_idx";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "customer_identifier",
ADD COLUMN     "customer_number" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "attorneys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "staff_number" TEXT,
    "department" TEXT NOT NULL DEFAULT '',
    "specialty" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attorneys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_staff" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "staff_number" TEXT,
    "department" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "trademark_type" "TrademarkType" NOT NULL,
    "applicant" TEXT NOT NULL,
    "classes" TEXT[],
    "trademark_details" JSONB NOT NULL,
    "class_selections" JSONB,
    "class_category" TEXT,
    "product_service" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT',
    "consultation_route" "ConsultationRoute",
    "consultation_started" BOOLEAN NOT NULL DEFAULT false,
    "client_intake" JSONB,
    "notes" TEXT,
    "user_id" TEXT NOT NULL,
    "application_number" TEXT,
    "application_date" TIMESTAMP(3),
    "registration_number" TEXT,
    "registration_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attorneys_user_id_key" ON "attorneys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_staff_user_id_key" ON "internal_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cases_case_number_key" ON "cases"("case_number");

-- CreateIndex
CREATE INDEX "cases_user_id_idx" ON "cases"("user_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_case_number_idx" ON "cases"("case_number");

-- CreateIndex
CREATE INDEX "cases_deleted_at_idx" ON "cases"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_customer_number_key" ON "clients"("customer_number");

-- CreateIndex
CREATE INDEX "clients_customer_number_idx" ON "clients"("customer_number");

-- AddForeignKey
ALTER TABLE "attorneys" ADD CONSTRAINT "attorneys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_staff" ADD CONSTRAINT "internal_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
