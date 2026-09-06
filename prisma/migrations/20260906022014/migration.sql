/*
  Warnings:

  - A unique constraint covering the columns `[space_id,slug]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[course_id,slug]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courses_space_id_slug_key" ON "courses"("space_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_course_id_slug_key" ON "sessions"("course_id", "slug");
