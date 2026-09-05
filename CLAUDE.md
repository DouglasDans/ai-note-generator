# AI Note Generator

Gera resumos estruturados de aulas a partir de áudio gravado, usando IA. Projeto
em reestruturação ativa — ver [PLANO.md](PLANO.md) para decisões, fases e o que
está pendente. Não repita aqui o que já está lá.

## Stack

- **Next.js 15** (App Router), **React 19**, TypeScript
- **@google/genai** — SDK oficial do Gemini (modelo: `gemini-3.8-flash`)
- **Firestore** (`firebase` 11.6.0) — em processo de substituição por Postgres
  (ver PLANO.md §4.2). Não expandir uso do Firestore.
- **MUI Joy + Emotion + SCSS Modules** — em processo de substituição por
  shadcn/ui + Tailwind (ver PLANO.md §4.5). Não adicionar componentes MUI Joy
  novos.
- **Vitest + Testing Library + jsdom** — testes
- Gerenciador de pacotes: **npm** (não yarn, apesar do CLAUDE.md global mencionar
  `yarn test`/`yarn lint` — aqui os comandos reais são `npm test`/`npm run lint`)
- Deploy alvo: **Railway** (container, não serverless — ver PLANO.md §3 e §4.7
  para o porquê)

## Comandos

```bash
npm run dev         # dev server
npm run build       # build de produção
npm start           # servir build de produção
npm test            # rodar testes (Vitest)
npm run test:watch  # testes em watch mode
npm run lint        # eslint (next lint)
npm run try:ai      # verificação manual do pipeline de IA contra a API real
                     # (exige GEMINI_API_KEY e um áudio de exemplo — ver o
                     # cabeçalho de scripts/try-generate-course-extraction.ts)
```

Antes de qualquer commit: `npm test` (tudo passando) e `npm run lint` (zero
erros nos arquivos tocados).

## Estrutura

```
src/
  app/                     # rotas Next.js (App Router)
  components/              # componentes React (MUI Joy — a migrar)
  config/                  # config do Firebase
  services/
    ai/                    # pipeline de ingestão (Gemini) — TypeScript puro,
                            # sem HTTP, sem banco. Ver seção "Pipeline de IA".
    firebase.service.ts    # acesso ao Firestore (a substituir)
  prompts/
    prompt.md              # o prompt do Gemini — ativo central do projeto,
                            # versionado via "prompt_version" nos dados salvos
  styles/, theme/           # SCSS Modules + Emotion (a migrar)
  types/                   # JsonResponse.ts é o shape LEGADO já gravado no
                            # Firestore hoje (não o que o pipeline de IA
                            # produz desde a Fase 2 — ver nota abaixo)
scripts/                   # utilitários executados via `node` puro — ver nota
                            # de convenção de import abaixo
```

## Pipeline de IA (`src/services/ai/`)

Fluxo: áudio → `generateCourseExtraction()` → upload no Gemini → chamada com
`responseSchema` (`schema.ts`) e prompt com data injetada (`prompt.ts`) →
validação da resposta (`parseCourseExtractionResponse.ts`) →
`CourseExtractionResult` (`types.ts`).

- `schema.ts` e `types.ts` descrevem a mesma forma de dado em dois lugares
  (schema do Gemini vs. tipo TS). Se um mudar, o outro também precisa.
- **`types.ts` (aqui) ≠ `src/types/JsonResponse.ts`.** São dois shapes
  diferentes de propósito: `types.ts` é o que o pipeline de IA produz hoje
  (inglês, datas ISO estruturadas); `JsonResponse.ts` é o formato legado já
  gravado no Firestore (português, datas em string livre). Ainda não há código
  ligando um ao outro — essa ponte (ou a substituição de um pelo outro) é
  trabalho da Fase 3, quando a persistência migra pra Postgres.
- `generateCourseExtraction()` recebe o client do `@google/genai` por
  parâmetro (`GenAIClient`, interface própria — não `Pick<GoogleGenAI, ...>`,
  porque as classes do SDK têm campos privados que quebrariam um fake de
  teste). Isso é o que permite testar a lógica de wiring sem bater na API real.
- `aula.data`/`session.date` **não é pedido à IA** — quem chama já sabe essa
  data (`recordingDate`) e ela é injetada no resultado depois do parse, junto
  com `prompt_version`. Pedir pro modelo também produzir seria duplicação e
  uma chance de alucinar uma data que já se tem com certeza.
- Testes cobrem só a lógica determinística (schema, interpolação de prompt,
  validação, wiring da chamada) — não a chamada real ao Gemini nem a
  qualidade do resumo, que é subjetiva.

## Convenção de import: `.ts` explícito em `src/services/ai/`

Os módulos dentro de `src/services/ai/` importam uns aos outros com extensão
`.ts` explícita (`from "./schema.ts"`), diferente do resto do projeto. Motivo:
`scripts/try-generate-course-extraction.ts` roda via `node` puro (sem bundler,
para verificação manual contra a API real), e a resolução ESM do Node exige
extensão explícita em imports relativos. `tsconfig.json` tem
`allowImportingTsExtensions: true` para permitir isso — seguro porque o
projeto roda com `noEmit: true` (quem emite é o SWC do Next, não o `tsc`).
Verificado que `tsc --noEmit`, Vitest e `next build` toleram a extensão.

Fora de `src/services/ai/`, siga a convenção existente (imports extensionless,
alias `@/` para `src/`) — não é necessário espalhar essa convenção pelo resto
do projeto.

## Testes

Colocados junto do código (`arquivo.test.ts` ao lado de `arquivo.ts`), não em
pasta `__tests__/` separada. `vitest.config.mts` inclui `src/**/*.{test,spec}.
{ts,tsx}`.
