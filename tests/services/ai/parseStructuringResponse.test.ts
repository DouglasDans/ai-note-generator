import { describe, expect, it } from "vitest";
import {
  StructuringParseError,
  parseStructuringResponse,
} from "@/services/ai/parseStructuringResponse";
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
    courses: [
      {
        name: "Banco de Dados",
        professor: "Fulano",
        sessions: [validSession()],
      },
    ],
  };
}

describe("parseStructuringResponse", () => {
  it("parses a well-formed response", () => {
    const result = parseStructuringResponse(JSON.stringify(validResponse()));

    expect(result.courses[0].name).toBe("Banco de Dados");
    expect(result.courses[0].sessions[0].title).toBe(
      "Introdução a bancos de dados"
    );
  });

  it("accepts null as a valid due_date_iso / date_iso", () => {
    const payload = validResponse();
    payload.courses[0].sessions[0].future_tasks.items[0].due_date_iso = null;
    payload.courses[0].sessions[0].mentioned_dates[0].date_iso = null;

    const result = parseStructuringResponse(JSON.stringify(payload));

    expect(result.courses[0].sessions[0].future_tasks.items[0].due_date_iso).toBeNull();
  });

  it("throws when there is no text at all", () => {
    expect(() => parseStructuringResponse(undefined)).toThrow(StructuringParseError);
  });

  it("throws when the text is not valid JSON", () => {
    expect(() => parseStructuringResponse("isso não é json")).toThrow(
      StructuringParseError
    );
  });

  it("throws when a required field is missing", () => {
    const malformed = JSON.stringify({
      courses: [{ name: "Banco de Dados" /* professor ausente */ }],
    });

    expect(() => parseStructuringResponse(malformed)).toThrow(StructuringParseError);
  });

  it("throws when due_date_iso is not a valid ISO date string", () => {
    const payload = validResponse();
    payload.courses[0].sessions[0].future_tasks.items[0].due_date_iso =
      "10/04/2026";

    expect(() =>
      parseStructuringResponse(JSON.stringify(payload))
    ).toThrow(StructuringParseError);
  });
});
