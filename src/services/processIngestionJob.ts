import {
  generateCourseExtraction,
  type GenAIClient,
  type GroqClient,
} from "@/services/ai/generateCourseExtraction";
import { persistCourseExtraction } from "@/db/course.repository";
import {
  markIngestionJobProcessing,
  markIngestionJobDone,
  markIngestionJobError,
} from "@/db/ingestionJob.repository";

export interface ProcessIngestionJobParams {
  geminiClient: GenAIClient;
  groqClient: GroqClient;
  jobId: string;
  spaceId: string;
  audioSource: Blob;
  audioMimeType: string;
  recordingDate: string;
  courseName?: string;
  professorName?: string;
}

/**
 * Roda em background — quem chama (o route handler) não espera essa promise
 * resolver antes de responder. Só faz sentido porque o processo é de longa
 * duração (container no Railway, não serverless): numa função serverless
 * isso seria morto assim que a resposta HTTP fosse enviada.
 *
 * Nunca deixa o erro escapar: sempre termina marcando o job como done ou
 * error, para o polling do cliente nunca ficar preso em "processing" para
 * sempre.
 */
export async function processIngestionJob(
  params: ProcessIngestionJobParams
): Promise<void> {
  const {
    geminiClient,
    groqClient,
    jobId,
    spaceId,
    audioSource,
    audioMimeType,
    recordingDate,
    courseName,
    professorName,
  } = params;

  try {
    await markIngestionJobProcessing(jobId);

    const result = await generateCourseExtraction({
      geminiClient,
      groqClient,
      audioSource,
      audioMimeType,
      recordingDate,
      courseName,
      professorName,
    });

    await persistCourseExtraction(spaceId, result);
    await markIngestionJobDone(jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[processIngestionJob] job ${jobId} failed:`, error);
    await markIngestionJobError(jobId, message);
  }
}
