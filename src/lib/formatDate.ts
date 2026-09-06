/**
 * Formata uma data "date-only" (colunas @db.Date do Prisma, sempre meia-noite
 * UTC) sem passar pelo fuso horário local do processo. Sem o `timeZone:
 * "UTC"` explícito, `toLocaleDateString` converte para o fuso local antes de
 * formatar — em qualquer fuso atrás de UTC (Brasil incluso), a data exibida
 * fica um dia atrás da gravada. Confirmado empiricamente: 2026-03-27 virava
 * "26/03/2026" rodando em America/Sao_Paulo.
 */
export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
