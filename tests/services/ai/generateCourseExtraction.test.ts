import { describe, expect, it, vi } from "vitest";
import {
  generateCourseExtraction,
  type GenAIClient,
} from "@/services/ai/generateCourseExtraction";
import { COURSE_EXTRACTION_RESPONSE_SCHEMA } from "@/services/ai/schema";

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
    text: overrides?.text ?? JSON.stringify({ full_transcript: "", courses: [] }),
  });

  const client: GenAIClient = {
    files: { upload },
    models: { generateContent },
  };

  return { client, upload, generateContent };
}

describe("generateCourseExtraction", () => {
  it("uploads the audio, calls generateContent with the schema and the interpolated prompt, and injects recording_date/prompt_version into every session", async () => {
    const { client, upload, generateContent } = fakeClient({
      text: JSON.stringify({
        full_transcript: "Transcrição completa.",
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
      client,
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

    expect(generateContent).toHaveBeenCalledTimes(1);
    const call = generateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-3.6-flash");
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseSchema).toBe(COURSE_EXTRACTION_RESPONSE_SCHEMA);
    expect(call.config.systemInstruction).toContain("2026-03-10");
    expect(call.config.systemInstruction).not.toContain("{{DATA_REFERENCIA}}");

    const session = result.courses[0].sessions[0];
    expect(session.recording_date).toBe("2026-03-10");
    expect(session.prompt_version).toBe("3.0");
    expect(result.full_transcript).toBe("Transcrição completa.");
  });

  it("accepts a Blob as the audio source, for web uploads with no temp file", async () => {
    const { client, upload } = fakeClient({
      text: JSON.stringify({ full_transcript: "", courses: [] }),
    });
    const blob = new Blob(["fake audio bytes"], { type: "audio/mp3" });

    await generateCourseExtraction({
      client,
      audioSource: blob,
      audioMimeType: "audio/mp3",
      recordingDate: "2026-03-10",
    });

    expect(upload).toHaveBeenCalledWith({
      file: blob,
      config: { mimeType: "audio/mp3" },
    });
  });

  it("throws when the upload response is missing uri or mimeType", async () => {
    const { client } = fakeClient();
    client.files.upload = vi
      .fn()
      .mockResolvedValue({ uri: undefined, mimeType: undefined });

    await expect(
      generateCourseExtraction({
        client,
        audioSource: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow(/upload/i);
  });

  it("propagates the parse error when Gemini returns malformed JSON", async () => {
    const { client } = fakeClient({ text: "não é json" });

    await expect(
      generateCourseExtraction({
        client,
        audioSource: "/tmp/aula.mp3",
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow();
  });
});
