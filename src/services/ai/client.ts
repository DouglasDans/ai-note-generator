import { GoogleGenAI } from "@google/genai";
import type { GenAIClient } from "./generateCourseExtraction.ts";

export function createGenAIClient(): GenAIClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  return new GoogleGenAI({
    apiKey,
    // 503 UNAVAILABLE ("high demand") é recomendado pela própria doc do
    // Gemini como retryable com backoff. httpStatusCodes não precisa ser
    // especificado: o padrão do SDK já cobre 408/429/5xx, o que inclui
    // 503. attempts=5 (padrão do próprio SDK) em vez de 3: como o usuário
    // não fica mais bloqueado esperando isso na tela (Fase 5i), dá pra
    // gastar mais tentativas em troca de mais chance de sucesso — o
    // custo é só tempo em background, não UX.
    httpOptions: {
      retryOptions: {
        attempts: 5,
        initialDelay: 30,
        maxDelay: 120,
      },
    },
  });
}
