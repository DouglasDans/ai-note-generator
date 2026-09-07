import Groq from "groq-sdk";
import type { GroqClient } from "./structureTranscript.ts";

export function createGroqClient(): GroqClient {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY não configurada.");
  }

  return new Groq({ apiKey });
}
