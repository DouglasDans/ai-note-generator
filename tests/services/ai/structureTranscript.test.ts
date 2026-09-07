import { describe, expect, it, vi } from "vitest";
import { structureTranscript, type GroqClient } from "@/services/ai/structureTranscript";
import { STRUCTURING_RESPONSE_SCHEMA } from "@/services/ai/structuringSchema";

function fakeClient(overrides?: { content?: string | null }) {
  const create = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            overrides?.content !== undefined
              ? overrides.content
              : JSON.stringify({ courses: [] }),
        },
      },
    ],
  });

  const client: GroqClient = {
    chat: { completions: { create } },
  };

  return { client, create };
}

describe("structureTranscript", () => {
  it("chama o Groq com o schema estrito e o prompt interpolado", async () => {
    const { client, create } = fakeClient({
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

    const result = await structureTranscript({
      client,
      transcript: "Hoje vimos ética profissional.",
      recordingDate: "2026-03-10",
      courseName: "Ética",
      professorName: "Andreza",
    });

    expect(create).toHaveBeenCalledTimes(1);
    const call = create.mock.calls[0][0];
    expect(call.model).toBe("openai/gpt-oss-120b");
    expect(call.response_format.json_schema.strict).toBe(true);
    expect(call.response_format.json_schema.schema).toBe(STRUCTURING_RESPONSE_SCHEMA);

    const systemMessage = call.messages.find((m: { role: string }) => m.role === "system");
    expect(systemMessage.content).toContain("2026-03-10");
    expect(systemMessage.content).not.toContain("{{DATA_REFERENCIA}}");

    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("Hoje vimos ética profissional.");
    expect(userMessage.content).toContain("Disciplina informada: Ética.");
    expect(userMessage.content).toContain("Professor informado: Andreza.");

    expect(result.courses[0].name).toBe("Ética");
  });

  it("propaga o erro de parse quando o Groq devolve JSON malformado", async () => {
    const { client } = fakeClient({ content: "não é json" });

    await expect(
      structureTranscript({
        client,
        transcript: "transcrição qualquer",
        recordingDate: "2026-03-10",
      })
    ).rejects.toThrow();
  });
});
