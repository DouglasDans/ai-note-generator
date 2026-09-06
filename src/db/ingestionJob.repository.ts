import { prisma } from "@/db/client";

export async function createIngestionJob(spaceId: string) {
  return prisma.ingestionJob.create({ data: { spaceId } });
}

export async function markIngestionJobProcessing(jobId: string) {
  return prisma.ingestionJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });
}

export async function markIngestionJobDone(jobId: string) {
  return prisma.ingestionJob.update({
    where: { id: jobId },
    data: { status: "done" },
  });
}

export async function markIngestionJobError(jobId: string, errorMessage: string) {
  return prisma.ingestionJob.update({
    where: { id: jobId },
    data: { status: "error", errorMessage },
  });
}

// findFirst com spaceId (não findUnique só por id) — mesmo motivo de
// getCourseBySlug/getSessionBySlug: não vazar job de outro space.
export async function getIngestionJob(jobId: string, spaceId: string) {
  return prisma.ingestionJob.findFirst({ where: { id: jobId, spaceId } });
}
