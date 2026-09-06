import { NextRequest, NextResponse } from "next/server";
import { findSpaceBySlug } from "@/db/space.repository";
import {
  createIngestionJob,
  markIngestionJobError,
} from "@/db/ingestionJob.repository";
import { processIngestionJob } from "@/services/processIngestionJob";
import { createGenAIClient } from "@/services/ai/client";

type Params = { params: Promise<{ space: string }> };

// Sem checagem de writeSecret ainda — qualquer um com o link do space pode
// subir áudio, mesma postura de "sem login" das outras decisões do projeto
// (PLANO.md, decisão 4.1: revisar se algum dia virar problema real).
export async function POST(request: NextRequest, { params }: Params) {
  const { space: spaceSlug } = await params;

  const space = await findSpaceBySlug(spaceSlug);
  if (!space) {
    return NextResponse.json({ error: "Space não encontrado." }, { status: 404 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  const recordingDate = formData.get("recordingDate");
  const courseName = formData.get("courseName");
  const professorName = formData.get("professorName");

  if (!(audio instanceof Blob) || typeof recordingDate !== "string" || !recordingDate) {
    return NextResponse.json(
      { error: "Áudio e data da gravação são obrigatórios." },
      { status: 400 }
    );
  }

  const job = await createIngestionJob(space.id);

  // createGenAIClient() lança de forma síncrona se faltar GEMINI_API_KEY —
  // isso não pode escapar pra fora do try/catch do processIngestionJob
  // (que só existe dentro da função), senão a resposta HTTP inteira quebra
  // em vez de o job simplesmente terminar como "error", que é como qualquer
  // outra falha do pipeline já é reportada pro polling do cliente.
  let client;
  try {
    client = createGenAIClient();
  } catch (error) {
    await markIngestionJobError(
      job.id,
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ jobId: job.id }, { status: 202 });
  }

  // Fire-and-forget: não aguardamos essa promise. Só funciona porque o
  // processo roda em container de longa duração (Railway), não serverless.
  void processIngestionJob({
    client,
    jobId: job.id,
    spaceId: space.id,
    audioSource: audio,
    audioMimeType: audio.type || "audio/mp3",
    recordingDate,
    courseName: typeof courseName === "string" ? courseName : undefined,
    professorName: typeof professorName === "string" ? professorName : undefined,
  });

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
