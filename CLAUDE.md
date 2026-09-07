# AI Note Generator

Gera resumos estruturados de aulas a partir de áudio gravado, usando IA. Projeto
em reestruturação ativa — ver [PLANO.md](PLANO.md) para decisões, fases e o que
está pendente. Não repita aqui o que já está lá.

## Stack

- **Next.js 15** (App Router), **React 19**, TypeScript
- **@google/genai** — SDK oficial do Gemini, usado só pra etapa de
  transcrição (`gemini-3.5-transcribe`)
- **groq-sdk** — SDK oficial do Groq, usado pra etapa de estruturação em JSON
  (`openai/gpt-oss-120b`, schema estrito) — ver seção "Pipeline de IA"
- **Prisma 7** (`@prisma/adapter-pg`, driver adapters — sem o binário Rust
  antigo) + **Postgres**. Client gerado em `src/generated/prisma/`
  (gitignored, `npm run db:generate` para regerar). Config em
  `prisma7.config.ts` (nome versionado — não renomear, o CLI resolve esse
  nome especificamente). Firestore/`firebase` foram removidos por completo na
  Fase 3 (sem migração de dados — decisão explícita, ver PLANO.md).
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
tests/                     # espelha src/ — ver seção "Testes"
src/
  app/
    page.tsx + actions.ts  # home: só um form pra entrar/criar space (sem
                            # listar nada — modelo Dontpad, PLANO.md 4.1)
    [space]/page.tsx                      # lista cursos do space
    [space]/[course]/page.tsx             # lista sessions do curso
    [space]/[course]/[session]/page.tsx   # detalhe da sessão
    api/[space]/ingest/route.ts           # POST: recebe áudio, dispara
                                           # processamento em background
    api/[space]/ingest/[jobId]/route.ts   # GET: status do processamento
  components/              # componentes React (MUI Joy — a migrar)
  db/
    client.ts              # PrismaClient + adapter-pg, lê DATABASE_URL
    *.repository.ts        # queries (space, course/session, ingestion job)
                            # — ver seção "Camada de persistência"
    mapCourseExtractionToRows.ts  # CourseExtractionResult (IA) -> shape do Prisma
    generateUniqueSlug.ts  # slugifica + resolve colisão com sufixo numérico
    slug.ts, secret.ts     # validação de slug de space e geração de writeSecret
  generated/prisma/        # client gerado (gitignored, não editar à mão)
  services/
    ai/                    # pipeline de ingestão (Gemini) — TypeScript puro,
                            # sem HTTP, sem banco. Ver seção "Pipeline de IA".
    processIngestionJob.ts # orquestra ai/ + db/: extrai, persiste, atualiza
                            # o status do job. Roda em background — ver
                            # nota no route handler de POST /api/[space]/ingest
  prompts/
    prompt.md              # o prompt do Gemini — ativo central do projeto,
                            # versionado via "prompt_version" nos dados salvos
  theme/                   # Emotion (a migrar)
scripts/                   # utilitários executados via `node` puro — ver nota
                            # de convenção de import abaixo
```

## Pipeline de IA (`src/services/ai/`)

Duas etapas, dois provedores — não é mais uma chamada única (decisão 4.3
revista em 07/09/2026, ver PLANO.md): uma instabilidade isolada num provedor
não derruba a extração inteira.

Fluxo: áudio → `transcribeAudio()` (Gemini, modelo dedicado
`gemini-3.5-transcribe`, sem schema — só texto) → transcrição →
`structureTranscript()` (Groq, `openai/gpt-oss-120b`, schema JSON estrito em
`structuringSchema.ts` + prompt em `src/prompts/structuring-prompt.md`) →
validação (`parseStructuringResponse.ts`) → `generateCourseExtraction()`
junta os dois (anexa a transcrição, injeta `recording_date`/`prompt_version`)
→ `CourseExtractionResult` (`types.ts`).

- `structuringSchema.ts` é JSON Schema puro (não o builder `Type` do
  `@google/genai`, que só a etapa de transcrição ainda usa indiretamente via
  `GenAIClient`) — formato exigido pelo `response_format` do Groq. Não tem
  `full_transcript`: a transcrição já vem pronta da etapa 1, não faz sentido
  pedir pro modelo reproduzir um texto longo palavra por palavra na saída.
  Campos nulos usam `"type": ["string", "null"]` (sintaxe exigida pelo modo
  estrito do Groq, confirmada na doc oficial — `anyOf` não é aceito ali).
  `structuringSchema.ts` e `types.ts` descrevem a mesma forma de dado em dois
  lugares; se um mudar, o outro também precisa.
  `src/db/mapCourseExtractionToRows.ts` é quem converte `types.ts` pro shape
  do Prisma (schema do banco) — ver seção "Camada de persistência".
- `transcribeAudio()` e `structureTranscript()` recebem o client (`@google/genai`
  e `groq-sdk`, respectivamente) por parâmetro — `GenAIClient`/`GroqClient`,
  interfaces próprias, não `Pick<Client, ...>`, porque as classes reais têm
  campos privados que quebrariam um fake de teste. `generateCourseExtraction()`
  recebe os dois (`geminiClient` + `groqClient`) e só orquestra.
- `aula.data`/`session.date` **não é pedido à IA** — quem chama já sabe essa
  data (`recordingDate`) e ela é injetada no resultado depois do parse, junto
  com `prompt_version`. Pedir pro modelo também produzir seria duplicação e
  uma chance de alucinar uma data que já se tem com certeza.
- Testes cobrem só a lógica determinística (schema, interpolação de prompt,
  validação, wiring de cada chamada, orquestração das duas etapas) — não a
  chamada real ao Gemini/Groq nem a qualidade do resumo, que é subjetiva.
  Verificação manual: `npm run try:ai` (exige `GEMINI_API_KEY` e
  `GROQ_API_KEY`).

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
- `IngestionJob` não referencia `Course`/`Session` — uma extração pode gerar
  mais de uma sessão, então não existe "a" sessão resultante de um job pra
  apontar. Quando o job termina, quem chama volta pra página do space
  inteiro, não pra uma sessão específica.

## Upload de áudio (`src/app/api/[space]/ingest/`)

- **Route Handler, não Server Action** — Server Actions têm limite de body
  de 1MB por padrão e bufferizam o corpo inteiro antes de processar;
  inadequado para áudio de 50-150MB.
- **Sem arquivo temporário**: o SDK do Gemini aceita `Blob` direto no
  upload, e um `File` de `FormData` é um `Blob`. `audioSource` em
  `generateCourseExtraction` aceita `string | Blob` por isso — o script CLI
  passa path, o route handler passa o `File` do upload sem nunca escrever
  em disco.
- **Fire-and-forget**: o `POST` cria o `IngestionJob`, dispara
  `processIngestionJob()` sem `await`, e responde 202 na hora. Só funciona
  porque o processo é de longa duração no Railway — numa function
  serverless isso seria morto assim que a resposta fosse enviada.
- `createGenAIClient()` e `createGroqClient()` lançam de forma **síncrona**
  se faltar `GEMINI_API_KEY`/`GROQ_API_KEY`. Isso é tratado no próprio route
  handler (não dentro do `processIngestionJob`), porque senão essa falha
  específica quebraria a resposta HTTP inteira em vez de só marcar o job
  como `error` — mesmo tratamento de qualquer outra falha do pipeline.

## Convenção de import: `.ts` explícito em `src/services/ai/`

Os módulos dentro de `src/services/ai/` importam uns aos outros com extensão
`.ts` explícita (`from "./structuringSchema.ts"`), diferente do resto do
projeto. Motivo:
`scripts/try-generate-course-extraction.ts` roda via `node` puro (sem bundler,
para verificação manual contra a API real), e a resolução ESM do Node exige
extensão explícita em imports relativos. `tsconfig.json` tem
`allowImportingTsExtensions: true` para permitir isso — seguro porque o
projeto roda com `noEmit: true` (quem emite é o SWC do Next, não o `tsc`).
Verificado que `tsc --noEmit`, Vitest e `next build` toleram a extensão.

Fora de `src/services/ai/`, siga a convenção existente (imports extensionless,
alias `@/` para `src/`) — não é necessário espalhar essa convenção pelo resto
do projeto. Isso vale também para os testes: mesmo testando algo dentro de
`src/services/ai/`, o teste mora em `tests/` (fora dessa pasta), então importa
sem extensão via `@/services/ai/...` — o `.ts` explícito é só entre os
próprios arquivos de dentro de `src/services/ai/`.

## Testes

Ficam em `tests/`, espelhando a estrutura de `src/` (`src/db/slug.ts` →
`tests/db/slug.test.ts`). Não são colocados ao lado do código — decisão
tomada na Fase 3c, revertendo a convenção original do projeto (colocation).
`vitest.config.mts` inclui `tests/**/*.{test,spec}.{ts,tsx}`.

Os testes de `tests/db/*.repository.test.ts` são de **integração real** contra
o Postgres local (precisa de `docker compose up -d` rodando) — diferente do
pipeline de IA, uma query com campo errado falha de forma determinística, não
há motivo para fake aqui. `vitest.config.mts` tem `fileParallelism: false`
por causa disso: os arquivos de teste de banco compartilham o mesmo Postgres
e fazem `beforeEach(() => prisma.space.deleteMany())` — em paralelo, um
arquivo limpa a tabela no meio do teste de outro. Não reverter essa flag sem
resolver o isolamento de outra forma (schema por worker, por exemplo).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
