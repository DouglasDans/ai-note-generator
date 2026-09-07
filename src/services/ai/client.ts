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
    // Gemini como retryable com backoff — já visto acontecer 2x seguidas
    // em verificação manual. httpStatusCodes não precisa ser
    // especificado: o padrão do SDK já cobre 408/429/5xx, o que inclui
    // 503. attempts=3 (tentativa original + 2 retries) mantém o job em
    // background por no máximo ~90s a mais antes de desistir — aceitável
    // porque o usuário não fica mais bloqueado esperando isso na tela.
    httpOptions: {
      retryOptions: {
        attempts: 3,
        initialDelay: 30,
        maxDelay: 120,
      },
    },
  });
}
