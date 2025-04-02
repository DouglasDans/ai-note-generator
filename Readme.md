# ✨ Starlight Project

**Um assistente de IA para transcrição de áudio, geração e estruturação de texto em Markdown.**

O **Starlight Project** tem como objetivo armazenar e organizar registros detalhados das aulas da faculdade. Com isso, facilita o acesso à informação passada em aula, aprimorando os estudos e a produtividade.

## 🚀 Funcionalidades

- 🔈 **Transcrição de Áudio** – Transcreve automaticamente todo o áudio das aulas.
- 📋 **Geração de Resumos** – Estrutura o conteúdo em tópicos organizados.
- 📅 **Extração de Datas e Atividades** – Identifica futuras tarefas, provas e outras informações importantes.
- 🧑‍💻 **Resumo de Atividades Práticas** – Documenta exercícios e práticas realizadas.
- 📎 **Geração de Tags** – Destaca pontos-chave, facilitando pesquisas futuras.

---

## 🛠 Tecnologias Utilizadas

- **Google Gemini API** – Para transcrição e geração dos dados.
- **Firebase** – Armazena e gerencia os registros de aula.
- **Python** – Responsável pelo processamento dos áudios e envio para a IA.
- **Next.js** – Interface gráfica para consulta e organização dos dados.

---

## 🏗 Como Configurar e Rodar o Projeto

### 🔧 1. Configuração das Variáveis de Ambiente

1. Crie um arquivo `.env` nas pastas `transcription-script` e `ui-client` baseado nos seus respectivos `env.example`.



### 🐍 2. Preparar o Ambiente Python

1. Certifique-se de ter o **Python 3.8+** instalado.
2. Navegue até a pasta `transcription-script` e crie um ambiente virtual:
   ```bash
   python -m venv venv
   ```
3. Ative o ambiente virtual:
   - **Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
4. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```



### 📂 3. Preparar os Arquivos Necessários

1. Coloque o arquivo de áudio com o nome `file.mp3` na pasta `transcription-script`.
2. Edite `prompt.md` na mesma pasta para personalizar as instruções para a IA caso veja necessidade.



### ▶ 4. Executar o Script de Transcrição

Na pasta `transcription-script`, execute:
```bash
python main.py
```

---

### 🖥 5. Executar o Frontend

1. Navegue até a pasta `ui-client`:
   ```bash
   cd ui-client
   ```
2. Crie um arquivo `.env` com base no `env.example`.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse o frontend em: [http://localhost:3000](http://localhost:3000).

---

## 📌 Contribuição

Sinta-se à vontade para contribuir com o projeto! Faça um fork, crie uma branch para suas alterações e envie um pull request.



