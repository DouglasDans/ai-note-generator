# AI Note Generator

Gera resumos estruturados de aulas a partir de áudio gravado, usando IA. Projeto
em reestruturação ativa — ver [PLANO.md](PLANO.md) para decisões, fases e o que
está pendente. Não repita aqui o que já está lá.

## Stack

- **Next.js 15** (App Router), **React 19**, TypeScript
- **@google/genai** — SDK oficial do Gemini (modelo: `gemini-3.8-flash`)
- **Prisma 7** (`@prisma/adapter-pg`, driver adapters — sem o binário Rust
  antigo) + **Postgres** — substituindo o Firestore (ver PLANO.md, Fase 3).
  Client gerado em `src/generated/prisma/` (gitignored, `npm run db:generate`
  para regerar). Config em `prisma7.config.ts` (nome versionado — não renomear,
  o CLI resolve esse nome especificamente).
- **Firestore** (`firebase` 11.6.0) — sendo substituído por Postgres/Prisma.
  Não expandir uso do Firestore; não migrar os dados existentes (decisão
  explícita — ver PLANO.md, Fase 3).
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
npm run dev          # dev server
npm run build        # build de produção
npm start            # servir build de produção
npm test             # rodar testes (Vitest)
npm run test:watch   # testes em watch mode
npm run lint         # eslint (next lint)
npm run try:ai       # verificação manual do pipeline de IA contra a API real
                      # (exige GEMINI_API_KEY e um áudio de exemplo — ver o
                      # cabeçalho de scripts/try-generate-course-extraction.ts)

npm run db:migrate   # cria e aplica migração (prisma migrate dev)
npm run db:generate  # regenera o client a partir do schema.prisma
npm run db:studio    # abre o Prisma Studio (GUI do banco)
```

Antes de qualquer commit: `npm test` (tudo passando) e `npm run lint` (zero
erros nos arquivos tocados).

## Banco de dados local

`docker compose up -d` sobe um Postgres local na porta `5434` (não `5432`, já
ocupada por outro projeto na máquina — ver `docker-compose.yml`). É o banco de
desenvolvimento; a connection string do Postgres do Railway (produção) fica
comentada no `.env` local, não em uso ativo.

## Estrutura

```
prisma/
  schema.prisma            # modelos: Space, Course, Session, TaskItem,
                            # MentionedDate (ver PLANO.md, Fase 3)
  migrations/
docker-compose.yml          # Postgres local de desenvolvimento
src/
  app/                     # rotas Next.js (App Router)
  components/              # componentes React (MUI Joy — a migrar)
  config/                  # config do Firebase
  db/
    client.ts              # PrismaClient + adapter-pg, lê DATABASE_URL
    *.repository.ts        # queries (space, course/session) — ver seção
                            # "Camada de persistência"
    mapCourseExtractionToRows.ts  # CourseExtractionResult (IA) -> shape do Prisma
    slug.ts, secret.ts     # validação de slug de space e geração de writeSecret
  generated/prisma/        # client gerado (gitignored, não editar à mão)
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

## Camada de persistência (`src/db/`)

- `space.repository.ts` / `course.repository.ts`: toda leitura de `Course`/
  `Session` é escopada por `spaceId`/`courseId` (não busca só por `id`) —
  quem só tem acesso a um space não pode puxar conteúdo de outro (modelo
  Dontpad, decisão 4.1 do PLANO.md).
- `mapCourseExtractionToRows.ts` é a ponte entre o que a IA produz
  (`src/services/ai/types.ts`) e o que o Postgres grava — função pura, sem
  Prisma importado, para ser testável sem banco.
- `TaskItem`/`MentionedDate` são tabelas próprias, não JSONB, para permitir
  `ORDER BY due_date_iso` direto no banco ao cruzar tarefas de várias
  `Session`s no dashboard futuro.

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

Os testes de `src/db/*.repository.test.ts` são de **integração real** contra
o Postgres local (precisa de `docker compose up -d` rodando) — diferente do
pipeline de IA, uma query com campo errado falha de forma determinística, não
há motivo para fake aqui. `vitest.config.mts` tem `fileParallelism: false`
por causa disso: os arquivos de teste de banco compartilham o mesmo Postgres
e fazem `beforeEach(() => prisma.space.deleteMany())` — em paralelo, um
arquivo limpa a tabela no meio do teste de outro. Não reverter essa flag sem
resolver o isolamento de outra forma (schema por worker, por exemplo).
