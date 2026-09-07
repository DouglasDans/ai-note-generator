import { describe, expect, it, vi } from "vitest";
import { transcribeAudio, type GenAIClient } from "@/services/ai/transcribeAudio";

function fakeClient(overrides?: { text?: string; uri?: string; mimeType?: string }) {
  const upload = vi.fn().mockResolvedValue({
    uri: overrides?.uri ?? "files/fake-uri",
    mimeType: overrides?.mimeType ?? "audio/mp3",
  });
  const transcript = overrides?.text ?? "Transcrição de teste.";
  // Formato real confirmado inspecionando a resposta bruta da API: o texto
  // vem numa part `audioTranscription`, não na propriedade de conveniência
  // `.text` do SDK.
  const generateContent = vi.fn().mockResolvedValue({
    candidates: [
      { content: { parts: transcript ? [{ audioTranscription: { text: transcript } }] : [] } },
    ],
  });

  const client: GenAIClient = {
    files: { upload },
    models: { generateContent },
  };

  return { client, upload, generateContent };
}

describe("transcribeAudio", () => {
  it("faz upload do áudio e chama generateContent com o modelo de transcrição dedicado", async () => {
    const { client, upload, generateContent } = fakeClient({
      text: "Hoje vimos normalização de dados.",
    });

    const transcript = await transcribeAudio({
      client,
      audioSource: "/tmp/aula.mp3",
      audioMimeType: "audio/mp3",
    });

    expect(upload).toHaveBeenCalledWith({
      file: "/tmp/aula.mp3",
      config: { mimeType: "audio/mp3" },
    });
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(generateContent.mock.calls[0][0].model).toBe("gemini-3.5-transcribe");
    expect(transcript).toBe("Hoje vimos normalização de dados.");
  });

  it("aceita um Blob como fonte do áudio (upload web, sem arquivo temporário)", async () => {
    const { client, upload } = fakeClient();
    const blob = new Blob(["fake audio bytes"], { type: "audio/mp3" });

    await transcribeAudio({ client, audioSource: blob, audioMimeType: "audio/mp3" });

    expect(upload).toHaveBeenCalledWith({
      file: blob,
      config: { mimeType: "audio/mp3" },
    });
  });

  it("lança quando o upload não retorna uri ou mimeType", async () => {
    const { client } = fakeClient();
    client.files.upload = vi.fn().mockResolvedValue({ uri: undefined, mimeType: undefined });

    await expect(
      transcribeAudio({ client, audioSource: "/tmp/aula.mp3", audioMimeType: "audio/mp3" })
    ).rejects.toThrow(/upload/i);
  });

  it("lança quando a transcrição volta vazia (sem fala detectável)", async () => {
    const { client } = fakeClient({ text: "" });

    await expect(
      transcribeAudio({ client, audioSource: "/tmp/aula.mp3", audioMimeType: "audio/mp3" })
    ).rejects.toThrow(/vazia/i);
  });
});
