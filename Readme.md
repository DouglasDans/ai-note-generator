# ✨ AI Note Generator

**Gere resumos estruturados das suas aulas a partir dos áudios gravados utilizando IA**

O **AI Note Generator** armazena e organiza registros detalhados de aulas. Com isso,
facilita o acesso à informação passada em aula, aprimorando os estudos e a produtividade.

## 🚀 Funcionalidades

- 🔈 **Transcrição de Áudio** – Transcreve automaticamente todo o áudio das aulas.
- 📋 **Geração de Resumos** – Estrutura o conteúdo em tópicos organizados.
- 📅 **Extração de Datas e Atividades** – Identifica futuras tarefas, provas e outras informações importantes.
- 🧑‍💻 **Resumo de Atividades Práticas** – Documenta exercícios e práticas realizadas.
- 📎 **Geração de Tags** – Destaca pontos-chave, facilitando pesquisas futuras.

## 🛠 Tecnologias Utilizadas

- **Next.js 15** (App Router) — interface e backend
- **React 19**
- **Google Gemini API** — transcrição e geração dos dados
- **Firebase / Firestore** — armazenamento dos registros de aula
- **Vitest** — testes

## 🚧 Em reestruturação

O projeto está passando por uma reestruturação. O script Python que fazia a
ingestão de áudio foi removido e está sendo reescrito como backend do próprio
Next.js, para que o upload seja feito pelo navegador em vez de linha de comando.

**No momento não há caminho de ingestão funcional** — a interface de leitura
continua operante sobre os dados já existentes.

Decisões, fases e estado atual: **[PLANO.md](PLANO.md)**.

## 🏗 Como Rodar o Projeto

### 1. Variáveis de ambiente

Crie um arquivo `.env` na raiz baseado no `.env.example`.

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Outros comandos

```bash
npm test         # roda os testes
npm run test:watch
npm run lint
npm run build
```

## 📌 Contribuição

Sinta-se à vontade para contribuir com o projeto! Faça um fork, crie uma branch
para suas alterações e envie um pull request.
