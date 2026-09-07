# Plano de Reestruturação — AI Note Generator

> Documento de trabalho. Registra as decisões tomadas, o motivo delas e a ordem
> de execução. Atualizar a cada fase concluída.
>
> Última atualização: 07/09/2026 · Fases 0 a 4 (4a, 4b, 4c — deploy em
> https://ainote.douglasdans.dev/), 4.5 a 4.6, 5 (5a-5j, interface
> shadcn/ui + UX de upload) e 6 (pipeline de IA em 2 etapas, Gemini +
> Groq) concluídas. Sem itens bloqueantes em aberto.

---

## 1. Objetivo

Hoje o projeto só é operável por quem o escreveu. O objetivo da reestruturação é
que **outra pessoa consiga usar sozinha**, sem instalar nada e sem depender do
Douglas — o caso concreto é a Giovanna usar nas aulas da faculdade dela para não
perder prazos, provas e conteúdo.

Objetivo secundário: tirar o projeto do domínio "Fatec / desenvolvimento de
sistemas" e deixá-lo utilizável para qualquer área de estudo.

### O gargalo real

Não é o Firebase. Para registrar uma aula hoje é preciso: clonar o repo,
instalar Python, criar venv, `pip install`, colocar um `firebase.json` (service
account, credencial de admin) no disco, renomear o áudio para exatamente
`file.mp3`, rodar `main.py` e responder três prompts no terminal.

**Matar o `transcription-script/` é o item de maior valor do projeto.** Todas as
fases existem para viabilizar isso.

---

## 2. Estado atual (auditado em 04/09/2026)

### Aplicação Next.js — raiz do repositório

| Item | Valor |
| --- | --- |
| Framework | Next.js 15.2.4 (App Router), React 19 |
| UI | MUI Joy `5.0.0-beta.52` + Emotion + SCSS Modules |
| Markdown | `next-mdx-remote`, `remark-gfm`, `rehype-starry-night` |
| Dados | `firebase` 11.6.0 (Firestore), acesso via `"use server"` |
| Gerenciador | **npm** (não yarn) |
| Testes | Vitest (adicionado na Fase 0) |
| Deploy atual | Vercel — <https://starlight-project-theta.vercel.app/> |
| Deploy alvo | **Railway** (confirmado) |

Rotas: `/` (lista todas as disciplinas), `/[disciplina]`, `/[disciplina]/[aula]`.

Acesso ao Firestore concentrado em `src/services/firebase.service.ts`
(3 funções, ~60 linhas) e `src/config/firebase.config.ts`.

### `transcription-script/` — Python · ❌ REMOVIDO

Deletado em 05/09/2026 junto com a unificação do repo. Descrição mantida como
referência para o port da Fase 1 — o código continua recuperável no histórico
do git.

Era um CLI local: lia `./file.mp3` e `./prompt.md`, pedia disciplina/professor/data
no terminal, chamava o Gemini, extraía o JSON da resposta **com regex**
(`extrair_json()`) e gravava no Firestore via service account (`./firebase.json`).

- `prompt_version` atual: **2.6**
- Modelo: `gemini-2.5-pro-exp-03-25`

O `prompt.md` **não foi deletado** — é o ativo real do projeto e foi movido para
`src/prompts/prompt.md`, onde o pipeline TS vai consumi-lo.

> ⚠️ Com a remoção, **não existe caminho de ingestão funcional** até a Fase 1
> entregar o pipeline. A leitura dos dados já existentes segue operante.

### Modelo de dados no Firestore

```
disciplinas/{id}          → { nome, professor }
  └── aulas/{id}          → { prompt_version, data, titulo, resumo, off_topic,
                              tarefas_futuras: { descricao_geral, detalhes[] },
                              datas_futuras_mencionadas[], atividades_em_aula,
                              tags[] }
```

### Problemas conhecidos

1. **`gemini-2.5-pro-exp-03-25` é modelo experimental de março/2025 e a família
   2.5 está deprecada.** O script provavelmente não roda mais. Verificar.
2. **Extração de JSON por regex** — workaround da época, hoje resolvido por
   `response_schema` nativo.
3. **Datas são string livre.** O `prompt.md` aceita `"12/03"`, `"semana que
   vem"`, `"antes do feriado"`. Bloqueia qualquer ordenação ou filtro.
4. **Env vars do Firebase sem prefixo `NEXT_PUBLIC_`**
   (`src/config/firebase.config.ts`). Só funciona porque todo acesso é
   server-side. Quebraria em qualquer uso client-side.
5. **A home lista tudo de todo mundo** (`getAllDisciplinas()`) — incompatível
   com o isolamento por space.
6. **MUI Joy nunca saiu de beta** e coexiste com Emotion e SCSS Modules: três
   sistemas de estilo no mesmo projeto.

---

## 3. Restrições verificadas

Checadas nas fontes em 04/09/2026 — não são suposições.

| Restrição | Consequência |
| --- | --- |
| Vercel Hobby: body de request limitado a **4.5 MB** | Upload de áudio de aula (50–150 MB) **não passa** por API route na Vercel |
| Vercel Hobby: duração de função **300s** (com fluid compute) | Suficiente para chamadas curtas, arriscado para áudio longo |
| Firebase Storage exige plano **Blaze** (cartão) desde 30/10/2024; sem Blaze perde acesso ao bucket a partir de 02/02/2026 | Irrelevante — o projeto **nunca usou Storage**, só Firestore |
| Firestore continua gratuito no plano Spark | — |
| Gemini free tier: 10 RPM / 1.500 req-dia | Folgado para uso de 1–2 pessoas |
| Modelo Flash atual: `gemini-3.8-flash` | Existe também `gemini-3.5-transcribe` (speech-to-text dedicado) |

**Implicação principal:** hospedar em container (Railway) em vez de serverless
elimina os limites de body e duração de uma vez. O upload deixa de ser problema
arquitetural.

Fontes: [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) ·
[Firebase Storage billing changes](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) ·
[Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)

---

## 4. Decisões tomadas

### 4.1 Sem login — modelo Dontpad

Cada **space** tem um ID na URL. Quem tem o link, vê. Sem cadastro, sem senha.

**Motivo:** login em site desconhecido é fricção que mata adoção, e o conteúdo
(resumo de aula) não é sensível o suficiente para justificá-la.

**Consequências obrigatórias:**
- A home **não pode listar nada** — vira só um campo "digite ou crie seu space".
- **Nenhuma rota pode enumerar spaces.** É isso que substitui o login.
- Leitura em `/[space]`, escrita em endpoint separado. Manter essa separação
  desde o início é o que permite plugar login depois mexendo em um lugar só.

### 4.2 Postgres no Railway, saindo do Firestore

**Motivo:** com o backend fora da Vercel, usar Firestore exige service account
JSON em env var — exatamente a fricção que se quer eliminar. Postgres no Railway
é uma `DATABASE_URL` injetada pelo próprio provedor. De brinde: full-text search
nas tags (que o prompt já gera "para facilitar pesquisas futuras" e que nunca foi
implementada) e ordenação de datas nativa para o dashboard.

**Custo:** migração dos dados atuais — baixo, são poucos documentos.

### 4.3 Pipeline em uma etapa — **revista na Fase 6 (07/09/2026)**

Decisão original: áudio → uma chamada ao Gemini → JSON estruturado.

**Alternativa avaliada e recusada na época:** duas etapas (`gemini-3.5-transcribe` →
texto persistido → estruturação). A vantagem seria reprocessar aulas antigas de
graça ao melhorar o prompt; o custo seria mais complexidade. Decisão: não.

**Motivo da revisão:** 503 "high demand" do Gemini acontecendo repetido em uso
real (ver Fase 5h/5i) — o argumento de simplicidade continua válido, mas
passou a perder pra resiliência: uma chamada única com um provedor só
significa que qualquer instabilidade nesse provedor derruba a extração
inteira. Ver Fase 6 para o desenho novo (duas etapas, dois provedores).

### 4.4 Normalização de datas — destrava o dashboard

O `"Considere que a aula foi realizada na FATEC no ano de 2025"` hardcoded no
prompt **não era gambiarra**: era âncora temporal. O professor fala "daqui a duas
semanas" e, sem saber a data de hoje, o modelo chutava datas erradas (ex.:
outubro/2023 quando a aula era de março/2025).

Isso **não melhora com modelo mais forte** — LLM não sabe que dia é hoje. A
correção é parametrizar, não remover: injetar a data real da gravação no prompt.

O modelo então resolve expressões relativas e emite **data ISO normalizada** em
campo próprio, mantendo o texto original em campo separado para conferência.

Sem isso o dashboard não existe: não há "próximas" nem "desta semana" sobre
string livre. Mesma correção vale para `tarefas_futuras`, onde hoje a data de
entrega vai **em negrito no fim da descrição** — formatação, não dado.

### 4.5 shadcn/ui + Tailwind

Substitui MUI Joy + Emotion + SCSS Modules. Reduz três sistemas de estilo a um,
sai de uma lib em beta permanente e ganha tema pronto e responsivo.

### 4.6 Nomenclatura neutra

`space` / `course` / `session` no código e nas URLs — "workspace" na interface se
ficar mais claro. Evitar "campus" ou "disciplina", que prendem o produto a
faculdade.

### 4.7 Repo unificado + backend no próprio Next.js, hospedado no Railway

Uma aplicação só, na raiz do repositório. O backend são route handlers do
Next.js — sem serviço separado. Deploy no **Railway** (confirmado em 05/09/2026).

**Motivo do host:** essa unificação **só fecha a conta fora da Vercel**. Route
handler na Vercel tem teto de 4.5 MB de body e áudio de aula tem 50–150 MB — não
tem workaround sem storage externo, que traria de volta o problema do plano Blaze.
Em container no Railway (`next start`) o limite é o que a aplicação definir.

**Feito em 05/09/2026:** `ui-client/*` movido para a raiz e `transcription-script/`
deletado. Os dois `.gitignore` foram mesclados manualmente — o do `ui-client` tinha
a seção de env vazia, e uma substituição simples teria feito `.env` deixar de ser
ignorado.

---

## 5. Arquitetura alvo

### Rotas

```
/                                → campo "digite ou crie seu space" (lista nada)
/[space]                         → dashboard + lista de disciplinas
/[space]/[course]                → lista de aulas
/[space]/[course]/[session]      → a aula
```

É a estrutura atual com um segmento a mais na frente.

**Atenção:** space no nível raiz exige uma lista de palavras reservadas
(`api`, `_next`, `favicon.ico`, ...) para não colidir. Precisa existir desde o
começo.

### Dashboard em `/[space]`

Dois blocos, ambos alimentados por dados que o prompt **já extrai hoje** — só
falta que sejam consultáveis:

1. **Próximas provas e entregas** — de `tarefas_futuras` + `datas_futuras`,
   filtrando o que já passou, ordenado por data.
2. **O que teve de importante recentemente** — aulas recentes do space com seus
   destaques.

Depende inteiramente de 4.4. Por isso schema vem antes do dashboard.

---

## 6. Fases

Cada fase termina com testes passando, lint limpo e um commit.

### Fase 0 — Infraestrutura de teste ✅ CONCLUÍDA

Vitest + Testing Library + jsdom em `ui-client/`.

- `vitest.config.mts` — jsdom, plugin React, alias `@/` → `src/`
- `vitest.setup.ts` — matchers do jest-dom
- `src/harness.smoke.test.tsx` — smoke test do harness
- scripts `test` e `test:watch`
- `@types/node` `^20` → `^24` (exigido pelo Vitest 5; alinha com o Node 24 local)

Nota: a config é `.mts` porque com `.ts` o Vite emitia warning de ESM carregado
como CommonJS. O alias `@/` está configurado mas ainda não é exercitado por
nenhum teste — a primeira importação real acontece na Fase 1.

### Fase 1 — Pipeline de ingestão em TypeScript ✅ CONCLUÍDA

Porta o `main.py` para TS como função pura: recebe áudio + data da gravação,
devolve o JSON validado. Sem HTTP, sem banco, sem UI.

- `@google/genai` (SDK oficial e atualmente mantido, confirmado nas docs vivas)
  substitui `google-genai` (Python)
- Modelo: `gemini-3.8-flash` — confirmado no `.d.ts` instalado e nas docs vivas.
  Três fetches da doc de structured output devolveram três formatos de API
  diferentes (resumo confundindo abas/versões) — a verificação final foi feita
  lendo `node_modules/@google/genai/dist/node/node.d.ts` diretamente, não a doc
- `responseSchema` nativo (`src/services/ai/schema.ts`) elimina o
  `extrair_json()` por regex
- Data da gravação injetada no prompt via placeholder `{{DATA_REFERENCIA}}`
  (`src/services/ai/prompt.ts`) — resolve a âncora temporal sem generalizar
  instituição/contexto, que é trabalho da Fase 2
- `prompt.md` enxuto: removidas as instruções de "apenas JSON, sem markdown",
  redundantes com `responseSchema` a nível de API
- Validação da resposta (`src/services/ai/parseAulaSummaryResponse.ts`) como
  última linha de defesa — `responseSchema` restringe a saída mas não garante
  formato 100% das vezes

**Arquivos novos:** `src/services/ai/{schema,prompt,parseAulaSummaryResponse,
generateAulaSummary,client}.ts` + testes · `scripts/try-generate-aula-summary.ts`

**Decisão de escopo de teste:** só a lógica determinística é testada (montagem
do schema, interpolação de data, validação de resposta, wiring da chamada) —
não a chamada real ao Gemini nem a qualidade do resumo gerado pela IA, que é
subjetiva e não determinística.

**Decisão de design (delegada):** `GenAIClient` é uma interface própria com só
os dois métodos usados (`files.upload`, `models.generateContent`), não
`Pick<GoogleGenAI, ...>` — as classes do SDK têm campos privados, e um objeto
fake de teste nunca as satisfaria estruturalmente. `contents` na interface usa
o tipo `ContentListUnion` do próprio SDK (não `unknown`) para que o client real
seja aceito sem cast.

**`allowImportingTsExtensions: true`** adicionado ao `tsconfig.json`: os
imports internos entre os módulos de `src/services/ai/` usam extensão `.ts`
explícita, porque o script de verificação roda via `node` puro (sem bundler) e
a resolução ESM do Node exige extensão. Seguro porque o projeto já roda com
`noEmit: true` — quem emite é o SWC do Next, não o `tsc`. Verificado que
`tsc --noEmit`, `vitest` e `next build` toleram os três a extensão explícita.

**Verificação manual pendente:** os testes automatizados cobrem só a lógica
determinística com um client fake — não provam que a chamada real ao Gemini
funciona. Rodar contra um áudio de verdade antes de considerar a fase
totalmente validada:
```
GEMINI_API_KEY=... npm run try:ai -- ./caminho/aula.mp3 2026-03-10
```

**DoD:** dado um áudio de exemplo, a função devolve JSON conforme o schema —
comprovado por testes na lógica determinística; a chamada real ainda depende
da verificação manual acima. Substitui o `main.py`, que já havia sido removido
na unificação do repo (commit `b8ef507`) — entre aquele commit e este, não
havia caminho de ingestão nenhum.

### Fase 2 — Schema novo ✅ CONCLUÍDA

- **Datas estruturadas:** `mentioned_dates[]` e `future_tasks.items[]` ganharam
  `*_iso: string | null` + `*_original_text: string`, substituindo string livre
  e a convenção de negrito no fim da descrição
- **Renomeado agora** (não adiado pra Fase 3, por decisão explícita — troca-se
  o risco de renomear duas vezes pelo de um diff maior de uma vez): schema e
  tipos do pipeline de IA em inglês neutro — `disciplinas→courses`,
  `aulas→sessions`, `nome→name`, `titulo→title`, `resumo→summary`,
  `tarefas_futuras→future_tasks`, `datas_futuras_mencionadas→mentioned_dates`,
  `atividades_em_aula→class_activities`. `professor` não mudou — já é palavra
  válida em inglês
- **`full_transcript`** adicionado no nível raiz da resposta (não por sessão —
  uma gravação gera uma transcrição só, mesmo com múltiplas sessions
  derivadas). Continua uma chamada só ao Gemini, não virou pipeline de duas
  etapas — decisão 4.3 mantida
- **`aula.data` removido do que se pede à IA.** Já sabíamos essa data
  (`recordingDate`, parâmetro de quem chama) — pedir pro modelo também
  produzir era duplicação e uma chance de a IA alucinar uma data que já
  tínhamos com certeza. `recording_date` e `prompt_version` (bump 2.6 → 3.0)
  agora são injetados no `Session` depois do parse, não pedidos ao modelo
- `prompt.md` reescrito por completo: prosa continua em português (idioma do
  conteúdo/aluno), só as chaves do JSON viraram inglês — senão o prompt
  ficaria descrevendo `resumo` enquanto o schema pede `summary`
- Renomeadas as duas funções centrais do pipeline para bater com os tipos
  novos: `generateAulaSummary`→`generateCourseExtraction`,
  `parseAulaSummaryResponse`→`parseCourseExtractionResponse` (arquivos e
  testes movidos junto)

**Deliberadamente fora desta fase:** `JsonResponse.ts`, `collectionTypes.ts`,
`firebase.service.ts` e os componentes de UI **não foram tocados** — eles
descrevem o formato que já está gravado no Firestore hoje, sem migração
nenhuma ainda. Renomear esses tipos agora faria o código mentir sobre o dado
real. Isso é trabalho da Fase 3, quando a persistência for reconstruída sobre
Postgres.

**Correção ao DoD original:** a redação antiga pedia "testes de normalização
de data cobrindo expressões relativas" — impreciso, porque quem resolve
"daqui a duas semanas" é o **modelo** (usando a âncora temporal da Fase 1), não
código nosso. O que testamos do nosso lado é o validador aceitando ISO válido
(`YYYY-MM-DD`) ou `null`, e rejeitando formato errado (`parseCourseExtraction
Response.test.ts`).

**DoD (revisado):** schema e tipos sincronizados entre `schema.ts` e
`types.ts`; validador rejeita data fora do padrão ISO; testes cobrem data
válida, `null`, e formato inválido. `tsc`, Vitest, lint e `next build`
passando. Verificação manual contra a API real ainda pendente (mesma ressalva
da Fase 1 — ver `npm run try:ai`).

### Fase 3 — Persistência (Prisma + Postgres no Railway)

Postgres já criado no Railway (05/09/2026). Decomposta em 3 sub-fases com gate
cada uma, por ser maior que as fases anteriores.

**ORM: Prisma**, não Drizzle. Cheguei a propor Drizzle (mais leve, sem etapa de
geração de código) — Douglas preferiu Prisma por familiaridade. Achado que muda
o argumento original: **Prisma 7 usa driver adapters** (`@prisma/adapter-pg`)
em vez do binário Rust antigo, então a crítica de peso/complexidade não se
aplica mais à versão atual.

**Versões fixadas** (a tag `latest` do pacote `prisma` no npm aponta pra uma
release candidate, `8.0.0-rc.13` — a estável real é `7.10.0`, valor de `prev`):
```
prisma@7.10.0, @prisma/client@7.10.0, @prisma/adapter-pg, pg, dotenv, @types/pg
```

**Decisão de schema:** `future_tasks.items[]` e `mentioned_dates[]` viram
**tabelas próprias** (`task_items`, `mentioned_dates`, FK pra `session`), não
coluna JSONB. Motivo: o dashboard da Fase 5 ("próximas provas do space
inteiro") cruza tarefas de várias sessions ordenadas por data — com JSONB isso
vira decodificar e ordenar na mão em JS; com tabela normalizada é
`ORDER BY due_date_iso` direto no banco. `tags` continua array nativo do
Postgres (`text[]`) — sem esse cruzamento entre sessions, e ganha busca de
graça com índice GIN.

**Sem migração dos dados do Firestore** — decisão explícita do Douglas, não é
prioridade agora nem está planejada pra "depois" com prazo. Os dados continuam
existindo no Firestore, só o código para de lê-los. Recuperável manualmente se
um dia fizer sentido.

- **3a — Setup ✅ CONCLUÍDA:** `schema.prisma`, primeira migração, conexão
  verificada. Sem app conectado ainda.
  - **Postgres local via Docker Compose para desenvolvimento**, não a conexão
    direta com o Railway — desvio da proposta original. O `DATABASE_URL`
    inicial fornecido era `postgres.railway.internal`, endereço da rede
    **interna** do Railway, inalcançável de fora (a migração falhou com
    `P1001: Can't reach database server`). Em vez de trocar pela connection
    string pública do Railway, decisão do Douglas foi manter um Postgres local
    (`docker-compose.yml`, porta `5434` — `5432`/`5433` já ocupadas por outros
    projetos na máquina) como banco de desenvolvimento, deixando o Postgres do
    Railway só para produção. A connection string do Railway ficou comentada
    no `.env` local para referência futura (deploy).
  - `npx prisma init` (sem `--no-skills`) tentou instalar ~60 arquivos de
    documentação-como-skill do repositório `prisma/skills` em `.claude/`,
    `.agents/` e `.windsurf/` — não solicitado, removido e o init refeito com
    `--no-skills`.
  - `prisma` e `@types/pg` foram parar em `dependencies` no primeiro
    `npm install`; movidos para `devDependencies` (CLI e tipos não são runtime).
  - Cliente gerado em `src/generated/prisma/` (gitignored) via `provider =
    "prisma-client"`; wrapper de conexão em `src/db/client.ts` usando
    `@prisma/adapter-pg`. Confirmado com escrita/leitura/remoção reais contra
    o Postgres local antes de seguir.
- **3b — Camada de persistência ✅ CONCLUÍDA:** `src/db/{reservedSlugs,slug,
  secret,mapCourseExtractionToRows,space.repository,course.repository}.ts`.
  - `slug.ts`: normaliza (trim + lowercase) e valida contra formato
    (`^[a-z0-9]+(-[a-z0-9]+)*$`, 3–63 chars) e a lista de reservados de
    `reservedSlugs.ts` — resolve o item #1 dos pontos em aberto.
  - `secret.ts`: `writeSecret` via `crypto.randomBytes(32)` em base64url.
  - `mapCourseExtractionToRows.ts`: função pura que converte
    `CourseExtractionResult` (Fase 2) para o shape que o Prisma grava —
    inclui parsear string `YYYY-MM-DD` para `Date` (interpretada como UTC
    pelo próprio spec do JS para strings de data pura, sem ajuste manual de
    timezone) e copiar `full_transcript` (raiz do resultado) para cada
    `Session` gravada, já que o schema não tem entidade "recording" separada.
  - `space.repository.ts` / `course.repository.ts`: `createSpace` (rejeita
    slug inválido antes de tocar o banco; `SlugTakenError` em colisão via
    `Prisma.PrismaClientKnownRequestError` código `P2002`),
    `findSpaceBySlug`, `persistCourseExtraction` (transação — uma sessão
    falhando não deixa curso gravado pela metade), `listCoursesBySpace`,
    `getCourseWithSessions`/`getSessionById` (escopados por `spaceId`/
    `courseId`, não só por `id`, para não vazar conteúdo entre spaces — ver
    decisão 4.1).
  - **Decisão de teste, diferente da Fase 1:** ali usei client fake porque a
    saída da IA é subjetiva/não-determinística. Aqui não há esse motivo — uma
    query Postgres com campo errado falha de forma determinística — então os
    repositórios têm **testes de integração reais** contra o Postgres local
    (Docker), não fakes. Só a lógica pura (slug, secret, mapper) ficou em
    teste unitário sem banco.
  - **Achado de configuração:** os testes de integração, rodando em paralelo
    (padrão do Vitest), corrompiam uns aos outros — dois arquivos de teste
    batendo no mesmo Postgres real, um limpando a tabela `space` no meio do
    teste do outro (`beforeEach` com `deleteMany`). Corrigido com
    `fileParallelism: false` no `vitest.config.mts`; aceitável no tamanho
    atual da suíte (39 testes, ~3.7s).
- **3c — Rotas ✅ CONCLUÍDA:** `/`, `/[space]`, `/[space]/[course]`,
  `/[space]/[course]/[session]` lendo do Postgres. `firebase.service.ts`,
  `collectionTypes.ts`, `firebase.config.ts`, `JsonResponse.ts` e o pacote
  `firebase` foram removidos, junto com os componentes só usados pelas rotas
  antigas (`aula-content`, `link-list`, `index-menu`) e os diretórios que
  ficaram vazios (`src/config`, `src/styles`, `src/types`). Next.js não
  permite dois nomes de segmento dinâmico diferentes na mesma posição da
  árvore de rotas — `[space]` e `[disciplina]` não coexistem, então essa
  remoção não era opcional, fazia parte de implementar a rota nova.

  **Course/Session ganharam slug** (decisão do Douglas, não adiada pra depois
  como o rascunho original desta seção cogitava): `@@unique([spaceId, slug])`
  e `@@unique([courseId, slug])` no schema, nova migração
  (`20260906022014` — sem sufixo descritivo porque `prisma migrate dev`
  exige TTY interativo, que o Bash não fornece; Douglas rodou no terminal
  dele e apertou enter sem nomear). `src/db/generateUniqueSlug.ts` slugifica
  e resolve colisão com sufixo numérico — necessário porque título de sessão
  vem da IA e repetir é plausível (ex.: duas aulas "Revisão para prova" no
  semestre); o sistema antigo usava o título como ID do documento no
  Firestore e uma repetição sobrescrevia a aula anterior *silenciosamente*.

  **Correção ao que já estava implementado na 3b:** `persistCourseExtraction`
  sempre criava um `Course` novo. Ao adicionar a unique constraint de slug
  por space, ficou claro que isso duplicaria cursos a cada upload E quebraria
  com erro de constraint na segunda tentativa com o mesmo nome. Corrigido
  para find-or-create por nome (case-insensitive) dentro do space — curso
  existente só recebe a sessão nova, replicando o comportamento do
  `main.py` original (nome sanitizado como ID do documento = upsert).

  **Bug de fuso horário pego na verificação manual, não em teste automatizado:**
  `session.recordingDate.toLocaleDateString("pt-BR")` exibia um dia a menos
  em qualquer ambiente rodando num fuso atrás de UTC (confirmado: servidor em
  America/Sao_Paulo, `new Date("2026-03-27")` virava "26/03/2026" na tela).
  Causa: colunas `@db.Date` do Prisma sempre viram meia-noite UTC em JS, e
  `toLocaleDateString` sem opção de fuso converte pro fuso local do processo
  antes de formatar. Corrigido com `src/lib/formatDate.ts`
  (`{ timeZone: "UTC" }` explícito), com teste que teria pegado a regressão.
  Isso é exatamente o tipo de bug que só aparece olhando a página renderizada
  — nenhum teste unitário/integração pegou, porque `new Date(...)` e
  `.toLocaleDateString(...)` são chamadas "corretas" isoladamente; o erro só
  existe na composição das duas rodando num fuso específico.

  **Achado de infraestrutura, também pego na verificação manual:** os testes
  de `tests/db/` e os dados de desenvolvimento (semeados na mão para testar
  as páginas) compartilhavam o mesmo Postgres/`DATABASE_URL`. Rodar
  `npm test` no meio da verificação apagou silenciosamente o space de teste
  criado manualmente (via o `beforeEach(prisma.space.deleteMany())` dos
  testes de repositório). Corrigido criando um banco `ai_note_generator_test`
  separado (mesmo container Docker) e um `.env.test` (versionado — sem
  segredo real, mesmas credenciais fixas do `docker-compose.yml`) carregado
  com `override: true` em `vitest.setup.ts` antes de qualquer módulo dar
  `import "dotenv/config"`. Precisa rodar `DATABASE_URL=...test npx prisma
  migrate deploy` manualmente sempre que uma migração nova for criada — não
  há automação disso ainda.

  **Testes movidos para `tests/`**, espelhando `src/` — pedido explícito do
  Douglas no meio desta sub-fase, revertendo a convenção de colocation
  documentada desde a Fase 0. Ver `CLAUDE.md` para a convenção atual.

**DoD:** as 3 sub-fases fechadas, `tsc`/testes/lint/build passando, rotas
novas verificadas com dado real (seed manual, não migrado) via curl e
navegador de verdade — incluindo os três caminhos do form da home (entrar em
space existente, criar um novo, rejeitar slug reservado).

### Fase 4 — Upload pela web

Decomposta como a Fase 3, mesmo padrão de gates.

**Decisões tomadas (05/09/2026):**
- **Sem writeSecret ainda** para autorizar upload — mesma postura de "sem
  login" das outras decisões (4.1). Qualquer um com o link do space pode
  subir áudio nele. Revisar se um dia virar problema real.
- **Status em tabela do Postgres** (`IngestionJob`), não em memória —
  sobrevive a restart do container no meio de um processamento longo.
- **DoD fecha local** (Docker), sem exigir Railway de produção — mesmo
  padrão da Fase 3. O corte de deploy real é item separado (ver §8).
- **Route Handler, não Server Action**, para o upload: Server Actions têm
  limite de body de **1MB por padrão** (configurável, mas bufferizam o
  corpo inteiro antes de processar) — inadequado para áudio de 50-150MB.
  Confirmado na doc oficial do Next.js, não chutado.

- **4a — Route Handler + processamento assíncrono ✅ CONCLUÍDA:**
  - `IngestionJob` (schema novo: `id`, `spaceId`, `status` — enum `pending`/
    `processing`/`done`/`error` —, `errorMessage`). Não referencia
    Course/Session: uma extração pode gerar mais de uma sessão, então "pra
    onde redirecionar quando terminar" é sempre a página do space, não uma
    sessão específica.
  - **Achado que eliminou a necessidade de arquivo temporário:** o SDK do
    Gemini aceita `file: string | Blob` no upload, e um `File` de
    `FormData` **é** um `Blob`. `generateCourseExtraction` foi generalizado
    (`audioFilePath: string` → `audioSource: string | Blob`) para aceitar
    os dois — o script CLI da Fase 1 continua passando path, o route
    handler passa o `File` direto do upload, sem nunca escrever em disco.
  - `POST /api/[space]/ingest`: recebe `multipart/form-data`, cria o job,
    dispara `processIngestionJob()` **sem aguardar** (fire-and-forget — só
    funciona porque o processo é de longa duração no Railway, não
    serverless; numa function serverless isso seria morto ao responder) e
    devolve `{ jobId }` com 202 imediatamente.
  - `GET /api/[space]/ingest/[jobId]`: consulta o status, escopado por
    `spaceId` (mesmo padrão de não vazar entre spaces).
  - `processIngestionJob` recebe o `GenAIClient` por parâmetro (mesma
    injeção de dependência do `generateCourseExtraction`) em vez de
    construir com `createGenAIClient()` internamente — mantém a função
    testável sem mock de módulo, e força quem chama (o route handler) a
    lidar com o erro **síncrono** que `createGenAIClient()` lança quando
    falta `GEMINI_API_KEY`. Sem isso, essa falha vazaria pra fora do
    try/catch do `processIngestionJob` e quebraria a resposta HTTP inteira
    em vez de só marcar o job como `error` — mesmo tratamento de qualquer
    outra falha do pipeline.
  - Testes: `processIngestionJob` com integração real (Postgres local +
    client fake), cobrindo sucesso e falha. Route handlers verificados na
    mão via curl contra o dev server local (sem `GEMINI_API_KEY`
    configurada aqui — confirma que o job termina em `error` de forma
    limpa, sem travar a requisição) e os três caminhos de erro (space
    inexistente, campo obrigatório faltando, job inexistente).
- **4b — Tela de upload ✅ CONCLUÍDA:** `src/components/ingest-form/` —
  Client Component sem MUI Joy (input `file` de áudio, `date` da gravação,
  dois campos de texto opcionais como hint pra IA), integrado em
  `/[space]/page.tsx`. Submete via `fetch` pro `POST /api/[space]/ingest`
  já existente e faz polling (`setInterval` de 2s) em
  `GET /api/[space]/ingest/[jobId]` até `done` (redireciona pro `/[space]`
  com `router.push` + `router.refresh()`, pra reler do Postgres) ou `error`
  (mostra a mensagem e reabilita o form).
  - **Polling com `setInterval` fixo, decisão consciente:** o callback é
    `async` e o intervalo não espera a resposta anterior antes de contar os
    2s seguintes — em tese duas requisições podem ficar em voo se uma
    demorar mais que isso. Aceito de propósito: é uma leitura idempotente e
    rápida no Postgres, não em cima do Gemini; `setTimeout` recursivo
    resolveria mas adicionaria código sem um problema real observado.
  - **Achado de teste, não de produção:** `user-event.upload()` simula
    `input.files` sobrescrevendo a propriedade só no wrapper JS do
    elemento; o construtor nativo `new FormData(form)` do jsdom lê o objeto
    impl interno, que esse mock não atualiza — em teste, o campo de áudio
    sempre chega como `File` vazio (`name: ''`, `size: 0`) dentro do
    FormData capturado, mesmo com `input.files[0].name` certo um instante
    antes. Limitação documentada da dupla jsdom+user-event, não do
    componente (funciona normalmente em browser real, confirmado na
    verificação manual). Os testes verificam o arquivo pelo `input.files`
    do DOM, não pelo conteúdo do `FormData` enviado ao `fetch`.
  - **`afterEach(cleanup)` faltando em `vitest.setup.ts`:** sem
    `test.globals: true` no `vitest.config.mts`, o auto-cleanup do Testing
    Library entre testes não era acionado — o primeiro arquivo de teste com
    múltiplos `render()` (`ingest-form`) empilhava DOM de um teste sobre o
    outro. Corrigido no setup global; não é específico deste componente.
  - **Cuidado de ambiente, não de código:** rodar `npm run build` com
    `npm run dev` já ativo corrompe o `.next/` compartilhado entre os dois
    (o dev passa a referenciar chunks que o build de produção sobrescreveu,
    erro `Cannot find module './vendor-chunks/@mui.js'`). Resolvido matando
    o processo de dev, apagando `.next/` e subindo de novo. Não rodar os
    dois processos ao mesmo tempo apontando pro mesmo `.next/`.
  - Verificado na mão contra o dev server local: upload de um arquivo,
    submit, job criado, polling detecta `error` (sem `GEMINI_API_KEY`
    configurada aqui — mesma situação da verificação da 4a) e reabilita o
    formulário com a mensagem certa. O caminho `done` → redirect só foi
    exercitado pelo teste automatizado com `fetch` mockado — depende de
    `GEMINI_API_KEY` real pra ser visto no navegador, pendência que já
    existia desde a Fase 1 (`npm run try:ai`).
- **4c — Deploy real no Railway:** `prisma migrate deploy` contra o banco
  de produção (pendência já registrada em §8) + corte Vercel→Railway.

**DoD:** a Giovanna sobe um áudio pelo navegador e vê a aula registrada, sem
Python, sem terminal, sem credencial no disco.

### Fase 4.5 — Upgrade Next.js 15 → 16 ✅ CONCLUÍDA

Decidido rodar como fase isolada antes da reforma visual (06/09/2026), pra
separar causa se algo quebrasse: se o build falhasse depois, dava pra saber
se foi o upgrade ou a troca de UI.

- `next` 15.2.4→16.3.4, `react`/`react-dom` 19.0→19.2.8, `@next/mdx` e
  `eslint-config-next` alinhados em 16.3.4 (todas com release estável
  disponível — verificado via `npm view`, não assumido; `prisma` continua
  pinado em 7.10.0 porque a tag `latest` do pacote ainda é uma release
  candidate, `8.0.0-rc.13`, mesma situação já documentada na Fase 3 pro
  Prisma 7)
- **Auditado contra o guia oficial de upgrade antes de bater a versão:**
  o projeto já não usava nenhuma das APIs que o Next 16 quebra (`params`/
  `searchParams` já eram `Promise` com `await` desde a Fase 3c, sem
  `middleware.ts`, sem `next/image`, sem `revalidateTag`, sem
  `unstable_*`) — risco avaliado como baixo antes de prosseguir, não só
  depois de quebrar
- **Achado 1 — Turbopack (padrão a partir do Next 16) não serializa plugins
  remark/rehype passados por referência de função:** `next.config.ts`
  quebrava o build com "does not have serializable options". Corrigido
  passando os plugins do MDX por nome de string (`"remark-gfm"`,
  `"rehype-starry-night"`) em vez de importar a função — sintaxe suportada
  especificamente para isso, confirmada na doc oficial de MDX do Next.
- **Achado 2 — `next lint` foi removido no Next 16**, junto com a opção
  `eslint` do `next.config.ts` (o `ignoreDuringBuilds: true` que existia
  virou no-op silencioso). Migrado pro flat config nativo do
  `eslint-config-next` 16 (`eslint-config-next/core-web-vitals` +
  `eslint-config-next/typescript`, substituindo o `FlatCompat` de
  `@eslint/eslintrc`, removido do `package.json` por ficar sem uso) e o
  script `lint` do `package.json` passou a chamar `eslint .` diretamente.
- `tsconfig.json`: `jsx` de `"preserve"` para `"react-jsx"` — mudança
  mandatória, aplicada automaticamente pelo `npx next typegen` (exigido no
  Next 16 pra gerar os helpers de tipo de rota).
- **Pendência registrada, não corrigida nesta fase:** o bump do
  `eslint-config-next` trouxe versão nova do `eslint-plugin-react-hooks`,
  que passou a reclamar (`react-hooks/set-state-in-effect`) do padrão
  `useEffect(() => setMounted(true), [])` em `src/components/theme-toggle/
  index.tsx` (usado pra evitar mismatch de hidratação SSR). Arquivo é
  MUI/Emotion puro, candidato a ser deletado/reescrito na Fase 5b — decisão
  foi não corrigir agora para não gastar trabalho num arquivo que já vai
  ser substituído.

**DoD:** `npm run build`, `npm test` (56/56) e smoke manual (dev server:
home, space existente, space inexistente, endpoint de upload com erro
esperado de campo faltando) passando. Lint com 1 erro conhecido e adiado
(ver achado acima) em arquivo fora do escopo desta fase.

### Fase 4.6 — Auditoria de segurança de dependências ✅ CONCLUÍDA

Motivada pelo pedido de manter tudo atualizado "pra poupar problemas de
segurança" — verificado com `npm audit`, não assumido que upgrade de versão
sozinho resolveria.

- **`next-mdx-remote` 5.0.0→6.0.0 (correção real, não só higiene):**
  vulnerabilidade alta (CVSS 8.8, CWE-94 — execução de código arbitrário),
  `GHSA-g4xw-jxrg-5f6m`, afeta `serialize`/renderização de MDX não
  confiável em versões 4.3.0–5.x. **Diretamente aplicável a este projeto:**
  as 3 chamadas de `MDXRemote` em `[session]/page.tsx` renderizam
  `summary`/`class_activities`/`off_topic` — conteúdo gerado pela IA a
  partir de áudio que qualquer um com o link do space pode enviar (decisão
  4.1, sem login). v6.0.0 passa a bloquear execução de JS por padrão
  (`blockJS`/`blockDangerousJS: true`) e remove a prop `scope` do modo RSC
  — não usada em nenhuma das 3 chamadas do projeto, upgrade sem mudança de
  código.
- **`npm audit fix` (sem `--force`):** resolveu sozinho 12 das 16
  vulnerabilidades originais, todas transitivas do toolchain de lint/build
  (eslint, js-yaml, minimatch, picomatch, immutable, flatted, ajv,
  brace-expansion), sem mudança de versão major em nada que o projeto usa
  diretamente.
- **Decisão: não rodar `npm audit fix --force`.** As 4 vulnerabilidades
  restantes são todas dentro do `prisma` (CLI, devDependency — não vai pro
  bundle de produção) via um driver MySQL que o pacote empacota mas que
  este projeto nunca usa (só Postgres via `@prisma/adapter-pg`). O único
  fix disponível rebaixaria `prisma` de 7.10.0 pra uma versão 6.x —
  trocaria uma vulnerabilidade em código inalcançável por uma regressão
  real de versão. Risco residual aceito e documentado, não ignorado.

**DoD:** `npm audit` de 16→4 vulnerabilidades, as 4 restantes avaliadas e
descartadas com justificativa (não é código alcançável em produção);
`next-mdx-remote` na versão corrigida; build e testes (56/56) passando.

### Fase 5 — Interface

Decomposta como a Fase 3/4, com gate (testes + lint + build + verificação
manual + commit) ao final de cada sub-fase.

**Direção de design (decidida em 06/09/2026):** tema neutro padrão do
shadcn/ui, sem identidade visual customizada — pedido explícito do Douglas
("padrão shadcn completo"). Mantém a fonte já configurada (Open Sans via
`next/font`). Esforço de design concentrado em hierarquia de informação
(dashboard, listas, estados vazio/erro), não em paleta/tipografia autoral.

**Pesquisado nas fontes oficiais antes de planejar (06/09/2026):** Tailwind
v4 não usa mais `tailwind.config.js` — config é CSS-first (`@import
"tailwindcss"` + `@theme` no próprio CSS). `npx shadcn@latest init` gera
`components.json` + `src/lib/utils.ts`; com npm (não pnpm/yarn) pode exigir
`--legacy-peer-deps` por peer deps de libs transitivas ainda não
formalmente atualizadas pra React 19. Dark mode: caminho oficial é
`next-themes` (substitui `CssVarsProvider`/`useColorScheme` do MUI Joy).
Fontes: tailwindcss.com/docs/installation/framework-guides/nextjs,
ui.shadcn.com/docs/{cli,react-19,dark-mode/next,theming}.

- **5a — Setup ✅ CONCLUÍDA:** `tailwindcss` + `@tailwindcss/postcss` +
  `postcss`, `postcss.config.mjs`; `globals.scss` → `globals.css`
  (conteúdo já era CSS puro, sem sintaxe Sass — troca de extensão, sem
  reescrita) com `@import "tailwindcss";` adicionado no topo (exigido
  pelo CLI do shadcn pra detectar Tailwind v4 antes de rodar).
  - **CLI do shadcn mudou de forma desde a pesquisa de 06/09:** não existe
    mais flag de cor-base (`neutral`/`zinc`/...); a v4.21.0 pede um
    **preset** de estilo (`Nova`, `Vega`, `Maia`, `Lyra`, `Mira`, `Luma`,
    `Sera`, `Rhea`) e uma base de componente headless (`radix`, `base`,
    `aria`). Pesquisado antes de escolher (não assumido): `Nova` é o novo
    padrão do CLI (`--defaults`), com espaçamento reduzido; `Vega` é
    descrito na documentação do próprio shadcn como "o visual clássico do
    shadcn/ui". Escolhido **Vega + radix** por ser a leitura mais literal
    da decisão de 06/09 ("tema neutro padrão, sem identidade
    customizada") — é o que a maioria reconhece como "a cara do shadcn",
    não um redesign novo do CLI. `radix` por ser a base mais madura/
    documentada do ecossistema.
  - Gerado: `components.json`, `src/lib/utils.ts`,
    `src/components/ui/button.tsx`, variáveis de tema (oklch, claro/escuro)
    em `globals.css`. Fonte trocada para Inter (`next/font/google`) em
    `layout.tsx`, mas MUI Joy/Emotion **não foram tocados** — coexistem
    até a 5b.
  - **Gate:** build/test/lint limpos (mesmo erro de lint da Fase 4.5,
    ainda adiado pra 5b — nada novo), verificado visualmente via
    screenshot que a home segue idêntica (nada consome Tailwind/shadcn na
    página ainda).
- **5b — Casca ✅ CONCLUÍDA:** `next-themes` (`ThemeProvider attribute="class"`
  em `layout.tsx`) substitui `theme-registry.tsx`/`emotion-cache.tsx`
  (deletados, `src/theme/` não existe mais); `navbar` e `theme-toggle`
  reconstruídos com `Button`/`buttonVariants` do shadcn + ícones
  `lucide-react`; `@mui/joy` + `@emotion/react` + `@emotion/styled`
  removidos do `package.json`.
  - **Fonte:** mantido Open Sans (decisão de design já registrada), não o
    Inter que o `shadcn init` da 5a tinha adicionado por padrão — variável
    renomeada de `--font-geist-sans` pra `--font-sans` pra bater com o
    token de tema que o shadcn gera no `globals.css`.
  - **Corrigido de fato, não só adiado:** o erro de lint
    `react-hooks/set-state-in-effect` pendente desde a Fase 4.5 (padrão
    `useEffect(() => setMounted(true), [])` pra evitar mismatch de
    hidratação) — resolvido com `useSyncExternalStore` (getSnapshot
    `true`/getServerSnapshot `false`), que resolve o mesmo problema sem
    setState dentro de efeito. `npm run lint` sai limpo agora.
  - **Gate:** toggle dark/light testado no navegador (clique muda o ícone
    sol/lua e o tema; reload mantém o tema escolhido, sem flash), build/
    test(56/56)/lint limpos.
- **5c — Páginas ✅ CONCLUÍDA:** home, `/[space]` (lista de cursos +
  `IngestForm` reestilizado), `/[course]`, `/[session]` (conteúdo MDX,
  tags, tarefas) com componentes shadcn (`button`, `input`, `label`,
  `card`, `badge`, `separator`). **Decisão mantida:** sem o `Form` do
  shadcn — acoplado a `react-hook-form`+`zod`, não se justifica pro padrão
  atual de form nativo + `fetch` (`ingest-form`, Fase 4b).
  - **Home segue direção de design pedida por Douglas:** card centralizado
    na tela, título "AI Note Generator" centralizado dentro do card.
  - **Achado, não assumido:** `@tailwindcss/typography` (`prose` classes)
    não estava instalado — sem ele, `session.summary`/`class_activities`/
    `off_topic` (Markdown vindo da IA) renderizariam sem nenhum estilo de
    tipografia (headings, negrito, listas, bloco de código todos iguais
    visualmente). Adicionado como dependência nova, com justificativa:
    é conteúdo central do produto, não estético. Ligado via `@plugin
    "@tailwindcss/typography";` no `globals.css` (sintaxe CSS-first do
    Tailwind v4, confirmada na doc oficial antes de escrever, não
    assumida).
  - **`sass` removido do `package.json`:** nenhum `.scss` restava no
    projeto depois da migração do `ingest-form` e do `navbar`.
  - **Bug pego na verificação visual, não em teste automatizado:** cards
    de curso/sessão (`/[space]` e `/[course]`) saíam com nome e
    professor/data empilhados e centralizados em vez de lado a lado — o
    componente `CardContent` do shadcn já define `flex-col` por padrão, e
    `className="flex items-center justify-between"` no call site não
    sobrescrevia a direção (sem conflito direto pro `tailwind-merge`
    resolver). Corrigido explicitando `flex-row`. Nenhum teste
    automatizado cobre esses componentes (são só leitura, sem lógica) —
    só a captura de tela pegou.
  - **Dados de desenvolvimento semeados manualmente** (curso, sessão,
    tarefas e datas mencionadas de exemplo) no Postgres local pra validar
    visualmente `/[course]` e `/[session]`, que estavam sem nenhum dado
    real desde a Fase 4 (sem `GEMINI_API_KEY` configurada localmente,
    nunca uma ingestão completou). Mesma prática já usada na Fase 3c.
  - **Gate:** rotas verificadas no navegador (desktop e mobile 390px,
    sem overflow), dark/light ok, `npm run build`/`npm test`
    (56/56)/`npm run lint` limpos.
- **5d — Dashboard em `/[space]` ✅ CONCLUÍDA:** `src/db/dashboard.repository.ts`
  novo — `listUpcomingItemsBySpace` agrega `TaskItem` + `MentionedDate` de
  todos os cursos do space, `listRecentSessionsBySpace` traz as sessions
  mais recentes.
  - **Regras fechadas (Example Mapping compacto, resolvido sem parar a
    sessão — task simples, 2 regras, sem ambiguidade de negócio real):**
    item só entra em "próximas" com `*_iso` preenchido e `>= agora`
    (inclusive); sem `*_iso` fica de fora — não dá pra saber se já passou;
    ordenado por data ascendente, cruzando todos os cursos do space.
    "Recentes" = 5 sessions mais recentes por `recordingDate desc` do
    space inteiro, sem recorte de janela de tempo (mais simples, sempre
    mostra algo se existir sessão).
  - **TDD real:** 9 testes de integração escritos antes da implementação
    (`tests/db/dashboard.repository.test.ts`, Postgres local) — cobrem
    filtro por data (igual/depois/antes de agora), exclusão de item sem
    `*_iso`, combinação entre cursos, não-vazamento entre spaces, `limit`.
    `now` é parâmetro injetável (default `new Date()`) pra teste não
    depender da data real do sistema — mesmo padrão de injeção de data já
    usado no pipeline de IA (Fase 1).
  - UI em `/[space]/page.tsx`: duas listas novas acima de "Cursos", com
    link direto pra sessão (`courseSlug`/`sessionSlug` incluídos no
    retorno do repositório especificamente pra isso, já que as rotas são
    por slug, não por id).
  - **Gate:** 65 testes passando (9 novos), lint limpo, build ok,
    verificado no navegador com dado semeado (ordem correta, item sem
    data excluído, link da lista leva pra sessão certa).

**DoD:** nenhuma dependência de MUI/Emotion no `package.json`; dashboard
mostrando próximas provas ordenadas.

### Fase 5e — Correções de UX após verificação manual do Douglas ✅ CONCLUÍDA

Rodada de feedback depois de navegar pela UI de verdade (space `aaa` com
dado semeado) — não estava no plano original da 5a-5d, mas mudanças
pequenas e diretamente ligadas ao que acabou de ser construído.

- **Terminologia "Curso"→"Disciplina" na interface.** Só o texto exibido —
  `course` continua sendo o nome interno no código/schema/rotas (decisão
  4.6 de nomenclatura neutra segue valendo, era especificamente sobre
  código e URLs).
- **Cores dos cards de tarefas/datas restauradas**, verificado no
  histórico do git da v1 (não confiado na memória — que se contradisse
  entre vermelho/amarelo/azul na conversa): `tarefas_futuras` era
  `color="danger"` (vermelho) no MUI Joy, `datas_futuras_mencionadas` era
  `color="warning"` (amarelo), não azul. Na página da sessão viram cards
  de verdade (`bg-red-50`/`bg-amber-50` com variante dark); no dashboard
  (`/[space]`) a mesma paleta aparece como texto colorido, não card cheio
  — cards pesariam visualmente ali por poder acumular itens de várias
  disciplinas ao mesmo tempo.
- **"Destaques recentes" removido** do dashboard — não fazia sentido pro
  Douglas listar título de aula; o que importa ali é só o que está por
  vir. `listRecentSessionsBySpace` e seus 3 testes foram removidos junto
  (código morto).
- **Campo de disciplina no upload virou combobox** (`src/components/
  discipline-combobox/`, shadcn `Command`+`Popover`): sugere as
  disciplinas já existentes nesse space enquanto digita — pra evitar
  duplicar por nome diferente ("Banco de Dados II" vs "Banco de Dados
  2") — mas digitar um nome que não existe ainda continua criando
  disciplina nova (mesmo comportamento do campo de texto livre anterior,
  decisão explícita do Douglas: não travar em lista fechada).
- **Navbar sabe em que space está** (`usePathname()` + `isReservedSlug`):
  o botão "Home" dentro de um space aponta pro space (`/[space]`), não
  pra raiz — evita sair sem querer. Botão "Sair" novo, só aparece dentro
  de um space, leva pra `/`.
- **Achado à parte, não de UI:** durante a verificação manual (áudio
  curto real, com `GEMINI_API_KEY` configurada), o pipeline bateu 503
  "UNAVAILABLE — high demand" do próprio Gemini duas vezes seguidas —
  confirmado pela doc oficial que é comportamento conhecido e recomendado
  tratar com retry exponencial no cliente HTTP do SDK (`@google/genai`
  expõe `HttpRetryOptions` nativo pra isso). **Ainda não implementado** —
  investigação foi interrompida pela rodada de feedback de UX acima; fica
  registrado como próximo item.
- **Também corrigido nessa rodada, achado ao mostrar o 503 pro Douglas:**
  `GET /api/[space]/ingest/[jobId]` devolvia o erro técnico bruto da SDK
  (JSON cru) direto pro `errorMessage` que o `ingest-form` mostra na
  tela. Motivo do Douglas: "isso não pode acontecer pro user". Corrigido
  para uma mensagem genérica no endpoint — o erro técnico continua
  gravado no banco (`ingestion_jobs.error_message`) pra debug, só não
  vaza mais pra quem está usando o sistema.

**Gate:** build/test(62/62)/lint limpos, verificado no navegador (combobox
abre e sugere/cria, cards coloridos nas duas telas, Home/Sair navegando
certo).

### Fase 5f — Enviar aula vira modal, não card sempre visível ✅ CONCLUÍDA

Segunda rodada de feedback: `/[space]` acumulava tudo visível de uma vez
(form de upload sempre aberto + próximas entregas + disciplinas). Douglas
pediu pra esconder o form atrás de um botão que abre um "dropdown" —
interpretado como modal (shadcn `Dialog`), por caber melhor os 4 campos do
form do que um Popover pequeno.

- `src/components/upload-session-dialog/` novo: botão "Enviar nova aula"
  no topo da página, abre um `Dialog` com o `IngestForm` dentro. Estado
  do modal (`open`) fica nesse client component, não na página (que é
  Server Component).
- `IngestForm` ganhou prop opcional `onDone?: () => void`, chamada quando
  o job termina (`status === "done"`) — o modal se fecha sozinho nesse
  momento, antes do `router.push`/`refresh` que já existiam. Prop opcional
  pra não forçar todo consumidor do componente a saber que existe modal.
  Testes do `ingest-form` não mudaram — comportamento sem o prop continua
  o mesmo, só ganhou um hook extra.
- Cabeçalho do space (`space.slug`) mantido como estava — a fala do
  Douglas sobre "nome da turma/nome da sessão" foi ambígua e se
  autocorrigiu na própria mensagem; interpretado como confirmação de que
  o nome já exibido (o slug) é o que deveria continuar como título
  principal, não um campo novo. Sinalizado a ele pra corrigir se a leitura
  estiver errada.

**Gate:** build/test(62/62)/lint limpos, verificado no navegador (botão
abre o modal com os 4 campos, título principal da página ficou só nome +
próximas entregas + disciplinas).

### Fase 5g — Autocomplete de professor + log de erro do Gemini ✅ CONCLUÍDA

- **`processIngestionJob`:** `console.error` adicionado no catch antes de
  gravar o job como `error` — o erro técnico já ficava no banco
  (`ingestion_jobs.error_message`), mas não aparecia no log do servidor,
  exigindo consultar o Postgres pra depurar. Pedido direto do Douglas.
- **Campo de professor também virou combobox com autocomplete**, mesmo
  padrão do de disciplina. O componente `discipline-combobox` foi
  generalizado pra `src/components/combobox/` (reutilizável, recebe
  `options`/`value`/`onValueChange`/`placeholder` por prop) em vez de
  duplicar a lógica pro professor.
- **Selecionar uma disciplina já cadastrada preenche o professor
  sozinho** — o vínculo já existe no banco (`Course.professor`), pedir de
  novo seria redundante. Continua editável depois (não trava o valor).
  `IngestForm` passou a receber `courses: {name, professor}[]` em vez de
  só `disciplines: string[]`, pra ter esse vínculo disponível no client.
- **TDD:** teste novo cobrindo o preenchimento automático, interagindo de
  verdade com o combobox (abre, clica na opção, confere o valor do
  professor).
- **Achado de ambiente, não de código:** jsdom não implementa
  `ResizeObserver` nem `Element.scrollIntoView`, ambos usados
  internamente pelo `cmdk` (base do `Command` do shadcn) — qualquer teste
  que abre um combobox quebrava com isso. Polyfills mínimos adicionados
  em `vitest.setup.ts`, mesmo padrão das outras lacunas de jsdom já
  documentadas ali.

**Gate:** build/test(63/63)/lint limpos, verificado no navegador
(selecionar "Banco de Dados II" preenche "Profa. Ana Souza" sozinho no
campo de professor).

### Fase 5h — Troca de modelo pra reduzir 503 ✅ CONCLUÍDA

Motivada pelos dois 503 "high demand" seguidos na verificação manual da
5f/5g. Pesquisado antes de agir, não assumido:

- **Pagar não ajuda:** confirmado em fóruns e docs oficiais do Google que
  503 é falta de capacidade computacional, não relacionado a cobrança —
  afeta tier pago e gratuito igualmente. O que tier pago melhora é limite
  de requisição por minuto (429), problema diferente.
- **Trocar de provedor não é opção pra essa demanda:** confirmado que a
  API do Claude não aceita áudio como entrada (só texto e imagem, até
  set/2026). OpenAI aceitaria, mas trocar de provedor exigiria reescrever
  schema, prompt e chamada da API do zero, sem garantia de mais
  estabilidade — 503 é problema de capacidade que qualquer provedor tem.
- **Trocar de modelo dentro do próprio Gemini, sim:** `gemini-3.8-flash`
  é descrito na doc oficial como "o modelo estável mais novo" — o mais
  concentrado em demanda no momento. Testado com chamada real à API
  (não assumido): `gemini-3.5-flash`, `3.6-flash` e `3.7-flash` também
  aceitam áudio normalmente (`modality: AUDIO` no `usageMetadata` da
  resposta), todos sem data de desligamento anunciada.
- **Escolhido `gemini-3.6-flash`**: uma geração atrás do mais hypado,
  reduz a concorrência por capacidade sem abrir mão de um modelo recente.
  Não é garantia total — 503 pode afetar qualquer modelo — mas é uma
  mudança de uma linha, sem custo, que reduz a chance.
- **Retry com backoff continua pendente** — decidido fazer só a troca de
  modelo por enquanto; o retry foi combinado pra próxima rodada, junto
  com a mudança de não bloquear o usuário durante o processamento.

**Gate:** build/test(63/63)/lint limpos. `GEMINI_MODEL` e o teste que
verifica a chamada (`generateCourseExtraction.test.ts`) atualizados
juntos.

### Fase 5i — Retry com backoff + upload não-bloqueante ✅ CONCLUÍDA

Pedido do Douglas: implementar o retry combinado antes, e "desbloquear o
usuário quando ele enviar o arquivo" — status de processamento visível
sem travar a tela.

- **Retry com backoff em `src/services/ai/client.ts`:** `GoogleGenAI`
  construído com `httpOptions.retryOptions` (`attempts: 3, initialDelay:
  30, maxDelay: 120`) — aplica a toda chamada HTTP feita pelo client
  (upload e generateContent), não precisa listar `httpStatusCodes`
  porque o padrão do SDK já cobre 408/429/5xx. **Confirmado funcionando
  em produção local**: um job real que antes falhava em ~30-50s com 503
  passou a demorar 258s antes de desistir — sinal direto de que as
  tentativas extras estão acontecendo, não só configuradas.
- **Upload deixou de bloquear o usuário.** Reestruturação de
  responsabilidades:
  - `IngestForm` não faz mais polling — só cuida do POST inicial e
    chama `onSubmitted(jobId)` assim que recebe o `jobId` (~1-2s, não
    minutos). Ficou bem mais simples.
  - `IngestionJobsProvider` (novo, `src/components/ingestion-jobs-provider/`)
    assume o polling, toast (sucesso/erro via `sonner`) e
    `router.refresh()` quando o job termina.
  - `IngestionJobsIndicator` (ícone de sino/spinner + dropdown com status
    por job) e `Toaster` do sonner.
  - **Achado corrigido antes de terminar, não depois:** a primeira
    versão colocava esse estado dentro da própria página do space
    (`SpaceUploadArea`) — o Douglas trocou de tela durante um
    processamento de verdade e o indicador sumiu, porque o componente
    desmontou. Corrigido subindo o `IngestionJobsProvider` pro layout
    raiz (`src/app/layout.tsx`), que só desmonta se o app inteiro
    desmontar — sobrevive a qualquer navegação entre páginas.
    `IngestionJobsIndicator` foi pro `Navbar` (visível em qualquer tela),
    e `SpaceUploadArea` foi removido por ficar redundante.
- **Verificado que `router.refresh()` realmente atualiza sem reload
  manual:** testado inserindo uma tarefa nova direto no Postgres
  (simulando o que um job real produziria) enquanto navegado pra outra
  página via link, depois voltando pro space via link — apareceu na
  lista de "Próximas provas e entregas" sem reload, confirmando que a
  página não serve payload em cache obsoleto na navegação de volta.
- **TDD:** testes de `ingest-form` simplificados (só cobrem o POST +
  `onSubmitted`, sem mais polling); testes novos em
  `tests/components/ingestion-jobs-provider/` cobrindo o fluxo completo
  (upload → indicador aparece → toast de sucesso/erro → para de pollar
  depois de terminar), compondo `IngestionJobsProvider` +
  `IngestionJobsIndicator` + `UploadSessionDialog` como em produção.
- **Verificado com job real contra a API** (não só mock): um upload de
  áudio de teste completou com sucesso de ponta a ponta (`status: done`,
  curso e sessão persistidos), confirmando pipeline + modelo novo +
  retry + non-blocking UX funcionando juntos.

**Gate:** build/test(66/66)/lint limpos, verificado no navegador com
job real (sucesso e timeout de retry), indicador sobrevivendo a troca
de tela, dashboard atualizando sozinho.

### Fase 5j — Indicador de processamento vazava entre spaces ✅ CONCLUÍDA

Achado do Douglas na verificação manual: o indicador de processamento
(5i) ficou no navbar global e passou a mostrar job de qualquer space,
não só do que está sendo visto — quebra o isolamento entre "turmas" que
o resto do projeto segue (decisão 4.1).

- `IngestionJobsProvider` continua global (necessário pra sobreviver à
  troca de tela — não mudou). O que mudou foi só a exibição:
  `IngestionJobsIndicator` agora recebe `spaceSlug` do `Navbar` (mesma
  lógica de `usePathname()` + `isReservedSlug` já usada ali pro botão
  Home/Sair) e filtra `jobs` pra só mostrar os do space atual. Fora de
  um space (`spaceSlug` nulo), não mostra nada.
- **TDD:** teste novo garantindo que job criado com `spaceSlug="fatec-2026"`
  não aparece num indicador renderizado com `spaceSlug="outro-space"`.
- **Achado de teste, à parte:** o teste novo deixou um `setInterval` de
  polling correndo sem mock pra segunda chamada (`GET status`), gerando
  unhandled rejection (`fetch` mockado só uma vez, intervalo chamava de
  novo). Corrigido com `mockResolvedValue` (sem `Once`) cobrindo
  chamadas subsequentes — mesmo padrão que os outros testes de polling
  já usavam, só não copiado na primeira versão deste teste.

**Gate:** build/test(67/67)/lint limpos, verificado no navegador:
job criado em `aaa` aparece no indicador de `aaa`, space
`ingest-4b-teste` não mostra nada.

---

### Fase 6 — Pipeline de IA em duas etapas: Gemini transcreve, Groq estrutura ✅ CONCLUÍDA

Revisão da decisão 4.3 (ver acima) — motivada pelos 503 recorrentes do
Gemini em uso real. Pesquisado antes de decidir, não assumido: nenhum
provedor com tier gratuito de verdade faz "entender áudio + seguir schema
JSON" numa chamada só além do Gemini (Claude não aceita áudio; OpenAI não
tem tier gratuito permanente; Mistral/Groq só transcrevem, não estruturam
num único call). A saída encontrada: transcrever com um modelo do Gemini e
estruturar com outro provedor — dois provedores, resiliência real contra
qualquer instabilidade isolada.

- **Etapa 1 — `transcribeAudio.ts`:** `gemini-3.5-transcribe` (modelo
  dedicado, capacidade separada do Flash). **Achado que só apareceu
  testando com áudio de fala real, não silêncio:** a resposta desse modelo
  não usa a propriedade de conveniência `.text` do SDK — o texto vem numa
  `part` própria, `audioTranscription.text`, dentro de
  `candidates[0].content.parts[]`. Confirmado inspecionando a resposta
  bruta da API antes de corrigir, não assumido a partir do comportamento
  de outros modelos Gemini.
- **Etapa 2 — `structureTranscript.ts`:** Groq, `openai/gpt-oss-120b`,
  schema JSON estrito (`structuringSchema.ts`) com
  `response_format: json_schema, strict: true` — confirmado na doc oficial
  do Groq, incluindo a sintaxe certa pra campo nulável
  (`"type": ["string", "null"]`, não `anyOf` — testei a suposição errada
  antes de escrever o schema final). Novo prompt dedicado
  (`src/prompts/structuring-prompt.md`): entrada é a transcrição em texto,
  não áudio, e não pede mais `full_transcript` de volta — esse campo já
  vem pronto da etapa 1, evita pedir pro modelo reproduzir texto longo
  palavra por palavra na saída.
- **`generateCourseExtraction()` virou só orquestração:** chama as duas
  etapas e junta o resultado (`full_transcript` da etapa 1 +
  `recording_date`/`prompt_version` injetados, igual antes). Assinatura
  mudou de `{ client, ... }` pra `{ geminiClient, groqClient, ... }` —
  ripple em `processIngestionJob.ts`, no route handler de upload
  (`POST /api/[space]/ingest`) e no script `try:ai`, todos atualizados
  juntos. `schema.ts` (schema Gemini de chamada única) removido — código
  morto depois da migração.
- **`GROQ_API_KEY`** nova env var (`.env.example` atualizado). `groq-sdk`
  adicionado como dependência.
- **`PROMPT_VERSION` bump 3.0 → 4.0** — mudança real de comportamento do
  pipeline, não só refactor interno.
- **TDD:** `transcribeAudio.test.ts` e `structureTranscript.test.ts` novos
  (client fake pra cada provedor); `generateCourseExtraction.test.ts`
  reescrito pra orquestração; `parseCourseExtractionResponse.ts` renomeado
  pra `parseStructuringResponse.ts` (mesmos validadores, sem o campo
  `full_transcript` que não existe mais nessa etapa).
- **Verificado com pipeline real de ponta a ponta** (não só testes com
  fake): áudio de fala sintética (`espeak-ng`, já que não havia amostra
  real disponível na hora) sobre banco de dados/normalização, com uma
  data relativa mencionada ("próxima semana, dia 10 de setembro"). Saída:
  transcrição fiel, resumo correto, **data resolvida certo pra
  `2026-09-10`** usando a data de referência informada, tarefa sem data
  mencionada corretamente marcada `"Não mencionado"` em vez de inventar
  uma data.

**Gate:** build/test(73/73)/lint limpos, pipeline real (Gemini + Groq)
verificado de ponta a ponta com resultado de qualidade — não só o formato
JSON correto, o conteúdo também.

---

## 7. Adiado (não é para agora)

| Item | Por quê |
| --- | --- |
| **Login / área privada** | Admin faz login e sobe, resto só lê pelo link. É a evolução natural de 4.1, mas não agora — decisão explícita de manter simples primeiro. |
| **Salas compartilhadas entre pessoas** | Só faz sentido com uma segunda pessoa real querendo. |
| **ID separado de leitura e escrita** | Foi levantado o risco de um link vazado queimar cota da API key. Descartado: o free tier do Gemini é folgado para o uso atual. Reavaliar se estourar. |
| **Schema dinâmico de blocos** | Os tópicos são estáveis entre disciplinas. Generalizar agora é complexidade sem demanda. |
| **Reescrita do zero** | O ativo do projeto é o `prompt.md`. Migração em fases entrega valor a cada passo; reescrita joga contexto fora. |

---

## 8. Pontos em aberto

Nenhum item bloqueante conhecido no momento — ver "Resolvido" abaixo pro
que fechou recentemente.

> Resolvido: host confirmado como Railway (05/09/2026). Lista de palavras
> reservadas para slug de space definida em `src/db/reservedSlugs.ts` (Fase
> 3b). Transcrição persistida como `full_transcript` (Fase 2). Course/Session
> ganharam slug próprio, não usam cuid cru na URL (Fase 3c). Modelo Gemini
> trocado de `gemini-3.8-flash` pra `gemini-3.6-flash` pra reduzir 503 de
> alta demanda (Fase 5h) — confirmado funcionando com jobs reais. Retry do
> Gemini subiu de 3 pra 5 tentativas (padrão do SDK), aprovado pelo
> Douglas (07/09/2026). **Fase 4c (deploy) concluída** — em produção em
> https://ainote.douglasdans.dev/.
