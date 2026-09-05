import { describe, expect, it } from "vitest";
import {
  AulaSummaryParseError,
  parseAulaSummaryResponse,
} from "./parseAulaSummaryResponse";

function validAula() {
  return {
    titulo: "Introdução a bancos de dados",
    data: "2026-03-10",
    resumo: "## Tópico\nConteúdo.",
    off_topic: "",
    tarefas_futuras: { descricao_geral: "", detalhes: [] },
    datas_futuras_mencionadas: [],
    atividades_em_aula: "",
    tags: ["sql", "bancos-de-dados"],
  };
}

function validDisciplinasPayload() {
  return {
    disciplinas: [
      {
        nome: "Banco de Dados",
        professor: "Fulano",
        aulas: [validAula()],
      },
    ],
  };
}

describe("parseAulaSummaryResponse", () => {
  it("parses a well-formed response into Disciplinas", () => {
    const result = parseAulaSummaryResponse(
      JSON.stringify(validDisciplinasPayload())
    );

    expect(result.disciplinas[0].nome).toBe("Banco de Dados");
    expect(result.disciplinas[0].aulas?.[0].titulo).toBe(
      "Introdução a bancos de dados"
    );
  });

  it("throws AulaSummaryParseError when there is no text at all", () => {
    expect(() => parseAulaSummaryResponse(undefined)).toThrow(
      AulaSummaryParseError
    );
  });

  it("throws AulaSummaryParseError when the text is not valid JSON", () => {
    expect(() => parseAulaSummaryResponse("isso não é json")).toThrow(
      AulaSummaryParseError
    );
  });

  it("throws AulaSummaryParseError when required fields are missing", () => {
    const malformed = JSON.stringify({
      disciplinas: [{ nome: "Banco de Dados" /* professor ausente */ }],
    });

    expect(() => parseAulaSummaryResponse(malformed)).toThrow(
      AulaSummaryParseError
    );
  });

  it("throws AulaSummaryParseError when an aula is missing a required field", () => {
    const payload = validDisciplinasPayload();
    delete (payload.disciplinas[0].aulas[0] as Partial<ReturnType<typeof validAula>>)
      .resumo;

    expect(() => parseAulaSummaryResponse(JSON.stringify(payload))).toThrow(
      AulaSummaryParseError
    );
  });
});
