import type { Aula, Disciplinas } from "@/types/JsonResponse";

export class AulaSummaryParseError extends Error {}

/**
 * responseSchema restringe a saída do Gemini mas não é garantia absoluta —
 * a validação aqui é a última linha de defesa antes do JSON entrar no resto
 * do sistema.
 */
export function parseAulaSummaryResponse(
  rawText: string | undefined
): Disciplinas {
  if (!rawText) {
    throw new AulaSummaryParseError(
      "A resposta do Gemini não contém texto."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (cause) {
    throw new AulaSummaryParseError("A resposta do Gemini não é um JSON válido.", {
      cause,
    });
  }

  if (!isDisciplinas(parsed)) {
    throw new AulaSummaryParseError(
      "A resposta do Gemini não corresponde ao formato esperado (Disciplinas)."
    );
  }

  return parsed;
}

function isDisciplinas(value: unknown): value is Disciplinas {
  if (typeof value !== "object" || value === null || !("disciplinas" in value)) {
    return false;
  }

  const { disciplinas } = value as { disciplinas: unknown };
  return Array.isArray(disciplinas) && disciplinas.every(isDisciplina);
}

function isDisciplina(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.nome === "string" &&
    typeof v.professor === "string" &&
    (v.aulas === undefined || (Array.isArray(v.aulas) && v.aulas.every(isAula)))
  );
}

function isAula(value: unknown): value is Aula {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.titulo === "string" &&
    typeof v.data === "string" &&
    typeof v.resumo === "string" &&
    typeof v.off_topic === "string" &&
    typeof v.atividades_em_aula === "string" &&
    Array.isArray(v.tags) &&
    typeof v.tarefas_futuras === "object" &&
    v.tarefas_futuras !== null &&
    Array.isArray(v.datas_futuras_mencionadas)
  );
}
