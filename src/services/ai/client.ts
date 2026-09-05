import { GoogleGenAI } from "@google/genai";
import type { GenAIClient } from "./generateAulaSummary.ts";

export function createGenAIClient(): GenAIClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  return new GoogleGenAI({ apiKey });
}
