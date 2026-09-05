import { describe, expect, it, vi } from "vitest";
import { generateAulaSummary, type GenAIClient } from "./generateAulaSummary";
import { AULA_RESPONSE_SCHEMA } from "./schema";

function fakeClient(overrides?: {
  text?: string;
  uri?: string;
  mimeType?: string;
}) {
  const upload = vi.fn().mockResolvedValue({
    uri: overrides?.uri ?? "files/fake-uri",
    mimeType: overrides?.mimeType ?? "audio/mp3",
  });
  const generateContent = vi.fn().mockResolvedValue({
    text: overrides?.text ?? JSON.stringify({ disciplinas: [] }),
  });

  const client: GenAIClient = {
    files: { upload },
    models: { generateContent },
  };

  return { client, upload, generateContent };
}

describe("generateAulaSummary", () => {
  it("uploads the audio, calls generateContent with the schema and the interpolated prompt, and returns the parsed result", async () => {
    const { client, upload, generateContent } = fakeClient({
      text: JSON.stringify({
        disciplinas: [{ nome: "Ética", professor: "Andreza", aulas: [] }],
      }),
    });

    const result = await generateAulaSummary({
      client,
      audioFilePath: "/tmp/aula.mp3",
      audioMimeType: "audio/mp3",
      recordingDate: "2026-03-10",
      disciplinaNome: "Ética",
      professorNome: "Andreza",
    });

    expect(upload).toHaveBeenCalledWith({
      file: "/tmp/aula.mp3",
      config: { mimeType: "audio/mp3" },
    });

    expect(generateContent).toHaveBeenCalledTimes(1);
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-3.8-flash");
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseSchema).toBe(AULA_RESPONSE_SCHEMA);
    expect(call.config.systemInstruction).toContain("2026-03-10");
    expect(call.config.systemInstruction).not.toContain("{{DATA_REFERENCIA}}");

    expect(result.disciplinas[0].nome).toBe("Ética");
  });

  it("throws when the upload response is missing uri or mimeType", async () => {
    const { client } = fakeClient();
    client.files.upload = vi
      .fn()
      .mockResolvedValue({ uri: undefined, mimeType: undefined });

    await expect(
      generateAulaSummary({
        client,
        audioFilePath: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow(/upload/i);
  });

  it("propagates the parse error when Gemini returns malformed JSON", async () => {
    const { client } = fakeClient({ text: "não é json" });

    await expect(
      generateAulaSummary({
        client,
        audioFilePath: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow();
  });
});
