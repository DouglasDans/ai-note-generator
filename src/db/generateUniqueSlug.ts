/**
 * Slugifica um texto (nome de curso, título de sessão) e resolve colisão com
 * um sufixo numérico. Pura e síncrona: quem chama já buscou os slugs
 * ocupados (numa query, ou vazio para um curso recém-criado) e vai
 * acumulando o Set a cada item processado no mesmo lote, para dois itens do
 * mesmo lote também não colidirem entre si.
 *
 * Título de sessão vem da IA — repetir é plausível (ex.: duas aulas
 * "Revisão para prova" no semestre). O sistema antigo usava o título como ID
 * do documento no Firestore, e uma segunda aula com o mesmo título
 * sobrescrevia a primeira silenciosamente. Esse sufixo é o que evita repetir
 * esse bug aqui.
 */
export function generateUniqueSlug(
  base: string,
  takenSlugs: ReadonlySet<string>,
  fallback: string
): string {
  const baseSlug = slugify(base) || fallback;

  let candidate = baseSlug;
  let suffix = 2;
  while (takenSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

// U+0300–U+036F é o bloco Unicode de diacríticos combinantes que sobram após
// normalize("NFD") (á -> a + acento agudo combinante, ç -> c + cedilha, ...).
const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
}
