import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/db/client";
import { createSpace } from "@/db/space.repository";
import { createIngestionJob } from "@/db/ingestionJob.repository";
import { listCoursesBySpace } from "@/db/course.repository";
import { processIngestionJob } from "@/services/processIngestionJob";
import type { GenAIClient, GroqClient } from "@/services/ai/generateCourseExtraction";

beforeEach(async () => {
  await prisma.space.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function fakeGeminiClient(transcript: string): GenAIClient {
  return {
    files: {
      upload: vi.fn().mockResolvedValue({ uri: "files/fake", mimeType: "audio/mp3" }),
    },
    models: {
      generateContent: vi
        .fn()
        .mockResolvedValue({
          candidates: [{ content: { parts: [{ audioTranscription: { text: transcript } }] } }],
        }),
    },
  };
}

function fakeGroqClient(content: string): GroqClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content } }] }),
      },
    },
  };
}

describe("processIngestionJob", () => {
  it("marks the job done and persists the extraction on success", async () => {
    const space = await createSpace("fatec-gestao-2026");
    const job = await createIngestionJob(space.id);

    const geminiClient = fakeGeminiClient("Transcrição.");
    const groqClient = fakeGroqClient(
      JSON.stringify({
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
      })
    );

    await processIngestionJob({
      geminiClient,
      groqClient,
      jobId: job.id,
      spaceId: space.id,
      audioSource: new Blob(["fake"], { type: "audio/mp3" }),
      audioMimeType: "audio/mp3",
      recordingDate: "2026-03-10",
    });

    const updatedJob = await prisma.ingestionJob.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(updatedJob.status).toBe("done");
    expect(updatedJob.errorMessage).toBeNull();

    const courses = await listCoursesBySpace(space.id);
    expect(courses).toHaveLength(1);
  });

  it("marks the job error instead of throwing when the pipeline fails", async () => {
    const space = await createSpace("fatec-gestao-2026");
    const job = await createIngestionJob(space.id);

    const geminiClient = fakeGeminiClient("Transcrição.");
    const groqClient = fakeGroqClient("isso não é json");

    await expect(
      processIngestionJob({
        geminiClient,
        groqClient,
        jobId: job.id,
        spaceId: space.id,
        audioSource: new Blob(["fake"], { type: "audio/mp3" }),
        audioMimeType: "audio/mp3",
        recordingDate: "2026-03-10",
      })
    ).resolves.toBeUndefined();

    const updatedJob = await prisma.ingestionJob.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(updatedJob.status).toBe("error");
    expect(updatedJob.errorMessage).toMatch(/JSON/i);

    const courses = await listCoursesBySpace(space.id);
    expect(courses).toHaveLength(0);
  });
});
