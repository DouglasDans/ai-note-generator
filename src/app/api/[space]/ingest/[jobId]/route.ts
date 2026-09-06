import { NextRequest, NextResponse } from "next/server";
import { findSpaceBySlug } from "@/db/space.repository";
import { getIngestionJob } from "@/db/ingestionJob.repository";

type Params = { params: Promise<{ space: string; jobId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { space: spaceSlug, jobId } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) {
    return NextResponse.json({ error: "Space não encontrado." }, { status: 404 });
  }

  const job = await getIngestionJob(jobId, space.id);
  if (!job) {
    return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    errorMessage: job.errorMessage,
  });
}
