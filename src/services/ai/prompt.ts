const DATA_REFERENCIA_PLACEHOLDER = "{{DATA_REFERENCIA}}";

export interface BuildSystemInstructionParams {
  recordingDate: string;
}

/**
 * O modelo não sabe que dia é hoje e precisa de uma âncora temporal para
 * resolver expressões relativas ditas em aula ("daqui a duas semanas").
 * Sem essa substituição o prompt.md fica sem a âncora e a data acaba errada.
 */
export function buildSystemInstruction(
  promptTemplate: string,
  { recordingDate }: BuildSystemInstructionParams
): string {
  if (!promptTemplate.includes(DATA_REFERENCIA_PLACEHOLDER)) {
    throw new Error(
      `O template do prompt não contém o placeholder ${DATA_REFERENCIA_PLACEHOLDER}.`
    );
  }

  const referencia =
    `A aula foi gravada em ${recordingDate}. Utilize esta data como referência ` +
    `para resolver expressões relativas de tempo mencionadas pelo professor ` +
    `(ex.: "daqui a duas semanas", "semana que vem", "no próximo mês").`;

  return promptTemplate.replaceAll(DATA_REFERENCIA_PLACEHOLDER, referencia);
}
