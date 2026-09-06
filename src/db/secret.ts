import { randomBytes } from "node:crypto";

/**
 * O write secret é o que autoriza subir áudio para um space (modelo Dontpad:
 * o slug é público para leitura, este secret é o que seria compartilhado só
 * com quem administra o space — ver PLANO.md, decisão 4.1).
 */
export function generateWriteSecret(): string {
  return randomBytes(32).toString("base64url");
}
