import { describe, expect, it, vi } from "vitest";
import {
  generateCourseExtraction,
  type GenAIClient,
  type GroqClient,
} from "@/services/ai/generateCourseExtraction";

function fakeGeminiClient(overrides?: {
  transcript?: string;
  uri?: string;
  mimeType?: string;
}) {
  const upload = vi.fn().mockResolvedValue({
    uri: overrides?.uri ?? "files/fake-uri",
    mimeType: overrides?.mimeType ?? "audio/mp3",
  });
  const transcript = overrides?.transcript ?? "Transcrição de teste.";
  const generateContent = vi.fn().mockResolvedValue({
    candidates: [{ content: { parts: [{ audioTranscription: { text: transcript } }] } }],
  });

  const client: GenAIClient = {
    files: { upload },
    models: { generateContent },
  };

  return { client, upload, generateContent };
}

function fakeGroqClient(overrides?: { content?: string }) {
  const create = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: overrides?.content ?? JSON.stringify({ courses: [] }),
        },
      },
    ],
  });

  const client: GroqClient = {
    chat: { completions: { create } },
  };

  return { client, create };
}

describe("generateCourseExtraction", () => {
  it("transcreve o áudio no Gemini, estrutura no Groq, e injeta recording_date/prompt_version em cada session", async () => {
    const { client: geminiClient, upload } = fakeGeminiClient({
      transcript: "Hoje falamos sobre ética profissional.",
    });
    const { client: groqClient, create } = fakeGroqClient({
      content: JSON.stringify({
        courses: [
          {
            name: "Ética",
            professor: "Andreza",
            sessions: [
              {
                title: "Aula 1",
                summary: "Resumo",
                off_topic: "",
                future_tasks: { overview: "", items: [] },
                mentioned_dates: [],
                class_activities: "",
                tags: [],
              },
            ],
          },
        ],
      }),
    });

    const result = await generateCourseExtraction({
      geminiClient,
      groqClient,
      audioSource: "/tmp/aula.mp3",
      audioMimeType: "audio/mp3",
      recordingDate: "2026-03-10",
      courseName: "Ética",
      professorName: "Andreza",
    });

    expect(upload).toHaveBeenCalledWith({
      file: "/tmp/aula.mp3",
      config: { mimeType: "audio/mp3" },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const userMessage = create.mock.calls[0][0].messages.find(
      (m: { role: string }) => m.role === "user"
    );
    expect(userMessage.content).toContain("Hoje falamos sobre ética profissional.");

    const session = result.courses[0].sessions[0];
    expect(session.recording_date).toBe("2026-03-10");
    expect(session.prompt_version).toBe("4.0");
    expect(result.full_transcript).toBe("Hoje falamos sobre ética profissional.");
  });

  it("aceita um Blob como fonte do áudio, para upload web sem arquivo temporário", async () => {
    const { client: geminiClient, upload } = fakeGeminiClient();
    const { client: groqClient } = fakeGroqClient();
    const blob = new Blob(["fake audio bytes"], { type: "audio/mp3" });

    await generateCourseExtraction({
      geminiClient,
      groqClient,
      audioSource: blob,
      audioMimeType: "audio/mp3",
      recordingDate: "2026-03-10",
    });

    expect(upload).toHaveBeenCalledWith({
      file: blob,
      config: { mimeType: "audio/mp3" },
    });
  });

  it("propaga o erro quando a transcrição falha, sem chamar o Groq", async () => {
    const { client: geminiClient } = fakeGeminiClient();
    geminiClient.files.upload = vi
      .fn()
      .mockResolvedValue({ uri: undefined, mimeType: undefined });
    const { client: groqClient, create } = fakeGroqClient();

    await expect(
      generateCourseExtraction({
        geminiClient,
        groqClient,
        audioSource: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow(/upload/i);

    expect(create).not.toHaveBeenCalled();
  });

  it("propaga o erro de parse quando o Groq devolve JSON malformado", async () => {
    const { client: geminiClient } = fakeGeminiClient();
    const { client: groqClient } = fakeGroqClient({ content: "não é json" });

    await expect(
      generateCourseExtraction({
        geminiClient,
        groqClient,
        audioSource: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow();
  });
});
