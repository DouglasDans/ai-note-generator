# Plano de Reestruturação — AI Note Generator

> Documento de trabalho. Registra as decisões tomadas, o motivo delas e a ordem
> de execução. Atualizar a cada fase concluída.
>
> Última atualização: 05/09/2026 · Fase 0 concluída

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

### `ui-client/` — Next.js

| Item | Valor |
| --- | --- |
| Framework | Next.js 15.2.4 (App Router), React 19 |
| UI | MUI Joy `5.0.0-beta.52` + Emotion + SCSS Modules |
| Markdown | `next-mdx-remote`, `remark-gfm`, `rehype-starry-night` |
| Dados | `firebase` 11.6.0 (Firestore), acesso via `"use server"` |
| Gerenciador | **npm** (não yarn) |
| Testes | Vitest (adicionado na Fase 0) |
| Deploy | Vercel — <https://starlight-project-theta.vercel.app/> |

Rotas: `/` (lista todas as disciplinas), `/[disciplina]`, `/[disciplina]/[aula]`.

Acesso ao Firestore concentrado em `src/services/firebase.service.ts`
(3 funções, ~60 linhas) e `src/config/firebase.config.ts`.

### `transcription-script/` — Python

CLI local. Lê `./file.mp3` e `./prompt.md`, pede disciplina/professor/data no
terminal, chama o Gemini, extrai o JSON da resposta **com regex**
(`extrair_json()`) e grava no Firestore via service account (`./firebase.json`).

- `prompt_version` atual: **2.6**
- Modelo: `gemini-2.5-pro-exp-03-25`

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

### 4.3 Pipeline em uma etapa

Áudio → uma chamada ao Gemini → JSON estruturado. Como já é hoje.

**Alternativa avaliada e recusada:** duas etapas (`gemini-3.5-transcribe` →
texto persistido → estruturação). A vantagem seria reprocessar aulas antigas de
graça ao melhorar o prompt; o custo seria mais complexidade. Decisão: não.

**Em aberto:** a chamada única pode devolver a transcrição como um campo a mais
do JSON, obtendo o mesmo benefício sem virar duas etapas. Decidir na Fase 2.

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

### Fase 1 — Pipeline de ingestão em TypeScript

Porta o `main.py` para TS como **função pura**: recebe áudio + data da gravação,
devolve o JSON validado. Sem HTTP, sem banco, sem UI — testável isoladamente.

- Chamada ao Gemini com `response_schema` (elimina o `extrair_json()` de regex)
- Modelo atualizado — confirmar o ID vigente na lista viva da API, não em blog
- Data da gravação injetada no prompt
- Enxugar o `prompt.md`: as ~8 linhas pedindo "APENAS JSON" tornam-se
  desnecessárias com schema nativo

**DoD:** dado um áudio de exemplo, a função devolve JSON conforme o schema, com
testes cobrindo o caminho feliz e falha de validação. O script Python ainda
existe, mas já não é o caminho principal.

Criar também o `CLAUDE.md` de projeto nesta fase.

### Fase 2 — Schema novo

- Datas ISO normalizadas + campo com o texto original
- Campo de data de entrega em `tarefas_futuras` (sai do negrito na descrição)
- Renomear para `space` / `course` / `session`
- `prompt.md` parametrizado (instituição, data, contexto) — sai o "FATEC 2025"
- Decidir se a transcrição vira campo do JSON (ver 4.3)

**DoD:** schema versionado, testes de normalização de data cobrindo expressões
relativas ("daqui a duas semanas", "semana que vem", data absoluta, data ausente).

### Fase 3 — Persistência

- Postgres no Railway
- Modelo: `space` → `course` → `session`
- Rotas `/[space]/...` + lista de palavras reservadas
- Home deixa de listar qualquer coisa
- Script de migração dos dados atuais do Firestore
- Remoção do `firebase` do `ui-client`

**DoD:** dados atuais migrados e visíveis nas rotas novas; nenhuma rota enumera
spaces.

### Fase 4 — Upload pela web

- Backend HTTP no Railway recebendo o arquivo
- Tela de upload
- Processamento assíncrono com status (áudio longo pode passar de minutos)

**DoD:** a Giovanna sobe um áudio pelo navegador e vê a aula registrada, sem
Python, sem terminal, sem credencial no disco. **`transcription-script/` é
deletado aqui.**

### Fase 5 — Interface

- Migração para shadcn/ui + Tailwind
- Remoção de MUI Joy, Emotion e SCSS Modules
- Dashboard em `/[space]`

**DoD:** nenhuma dependência de MUI/Emotion no `package.json`; dashboard
mostrando próximas provas ordenadas.

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

1. **Confirmar Railway** como host (referido como "Highway" na conversa). Toda a
   Fase 3 e 4 dependem disso.
2. Lista definitiva de palavras reservadas para paths de space.
3. Transcrição como campo do JSON — decidir na Fase 2.
4. Modelo Gemini definitivo — confirmar na lista viva da API no momento da
   Fase 1.
