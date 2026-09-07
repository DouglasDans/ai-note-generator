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

  // job.errorMessage guarda o erro técnico bruto (mensagem da SDK do
  // Gemini, stack, etc.) — útil pra debug direto no banco, mas não deve
  // vazar pro usuário final. A causa real pode ser qualquer coisa (API
  // fora do ar, áudio inválido, timeout); tentar mapear cada caso seria
  // frágil, então a resposta ao cliente é sempre genérica.
  return NextResponse.json({
    status: job.status,
    errorMessage:
      job.status === "error"
        ? "Não foi possível processar o áudio. Tente novamente em alguns minutos."
        : null,
  });
}
