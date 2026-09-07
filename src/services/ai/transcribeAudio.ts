import { createPartFromUri, createUserContent, type ContentListUnion } from "@google/genai";

// Modelo dedicado de transcrição, não o Flash de propósito geral — capacidade
// separada (etapa 1 do pipeline transcrever->estruturar, ver PLANO.md).
const GEMINI_TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

/**
 * Mesmo motivo da interface própria em generateCourseExtraction (histórico):
 * as classes do SDK do @google/genai têm campos privados — um client fake de
 * teste nunca satisfaria isso estruturalmente com Pick<GoogleGenAI, ...>.
 */
export interface GenAIClient {
  files: {
    upload(params: {
      file: string | Blob;
      config?: { mimeType?: string };
    }): Promise<{ uri?: string; mimeType?: string }>;
  };
  models: {
    generateContent(params: {
      model: string;
      contents: ContentListUnion;
      config?: {
        systemInstruction?: string;
        responseMimeType?: string;
        responseSchema?: unknown;
      };
    }): Promise<{
      text?: string;
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            audioTranscription?: { text?: string };
          }>;
        };
      }>;
    }>;
  };
}

export interface TranscribeAudioParams {
  client: GenAIClient;
  /** Caminho de arquivo (uso via CLI/scripts) ou Blob/File (upload web —
   * um File de FormData já é um Blob, sem precisar escrever em disco). */
  audioSource: string | Blob;
  audioMimeType: string;
}

export async function transcribeAudio(params: TranscribeAudioParams): Promise<string> {
  const { client, audioSource, audioMimeType } = params;

  const uploadedFile = await client.files.upload({
    file: audioSource,
    config: { mimeType: audioMimeType },
  });

  if (!uploadedFile.uri || !uploadedFile.mimeType) {
    throw new Error(
      "Upload do áudio não retornou URI ou mimeType — resposta inesperada do Gemini."
    );
  }

  const response = await client.models.generateContent({
    model: GEMINI_TRANSCRIBE_MODEL,
    contents: createUserContent([createPartFromUri(uploadedFile.uri, uploadedFile.mimeType)]),
  });

  // gemini-3.5-transcribe devolve o texto dentro de uma part
  // `audioTranscription`, não na propriedade de conveniência `.text` do SDK
  // (que só concatena parts de texto puro) — confirmado inspecionando a
  // resposta bruta da API, não assumido a partir de outros modelos Gemini.
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const transcript = parts
    .map((part) => part.audioTranscription?.text ?? part.text ?? "")
    .join("");

  if (!transcript) {
    throw new Error(
      "A transcrição voltou vazia — não há conteúdo de fala detectável no áudio enviado."
    );
  }

  return transcript;
}
