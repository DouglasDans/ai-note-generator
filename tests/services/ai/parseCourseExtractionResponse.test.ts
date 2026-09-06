import { describe, expect, it } from "vitest";
import {
  CourseExtractionParseError,
  parseCourseExtractionResponse,
} from "@/services/ai/parseCourseExtractionResponse";
import type { SessionExtraction, TaskItem } from "@/services/ai/types";

function validTaskItem(): TaskItem {
  return {
    title: "Prova P1",
    description: "Prova sobre normalização de banco de dados.",
    due_date_iso: "2026-04-10",
    due_date_original_text: "daqui a duas semanas",
  };
}

function validSession(): SessionExtraction {
  return {
    title: "Introdução a bancos de dados",
    summary: "## Tópico\nConteúdo.",
    off_topic: "",
    future_tasks: { overview: "", items: [validTaskItem()] },
    mentioned_dates: [
      { date_iso: "2026-04-10", original_text: "daqui a duas semanas", description: "Prova P1" },
    ],
    class_activities: "",
    tags: ["sql", "bancos-de-dados"],
  };
}

function validResponse() {
  return {
    full_transcript: "Transcrição completa da aula...",
    courses: [
      {
        name: "Banco de Dados",
        professor: "Fulano",
        sessions: [validSession()],
      },
    ],
  };
}

describe("parseCourseExtractionResponse", () => {
  it("parses a well-formed response", () => {
    const result = parseCourseExtractionResponse(JSON.stringify(validResponse()));

    expect(result.courses[0].name).toBe("Banco de Dados");
    expect(result.courses[0].sessions[0].title).toBe(
      "Introdução a bancos de dados"
    );
  });

  it("accepts null as a valid due_date_iso / date_iso", () => {
    const payload = validResponse();
    payload.courses[0].sessions[0].future_tasks.items[0].due_date_iso = null;
    payload.courses[0].sessions[0].mentioned_dates[0].date_iso = null;

    const result = parseCourseExtractionResponse(JSON.stringify(payload));

    expect(result.courses[0].sessions[0].future_tasks.items[0].due_date_iso).toBeNull();
  });

  it("throws when there is no text at all", () => {
    expect(() => parseCourseExtractionResponse(undefined)).toThrow(
      CourseExtractionParseError
    );
  });

  it("throws when the text is not valid JSON", () => {
    expect(() => parseCourseExtractionResponse("isso não é json")).toThrow(
      CourseExtractionParseError
    );
  });

  it("throws when a required field is missing", () => {
    const malformed = JSON.stringify({
      courses: [{ name: "Banco de Dados" /* professor ausente */ }],
    });

    expect(() => parseCourseExtractionResponse(malformed)).toThrow(
      CourseExtractionParseError
    );
  });

  it("throws when due_date_iso is not a valid ISO date string", () => {
    const payload = validResponse();
    payload.courses[0].sessions[0].future_tasks.items[0].due_date_iso =
      "10/04/2026";

    expect(() =>
      parseCourseExtractionResponse(JSON.stringify(payload))
    ).toThrow(CourseExtractionParseError);
  });
});
