
> **Instruções para o modelo**:  
> A partir da transcrição de áudio da aula a seguir, você deve gerar um JSON com a seguinte estrutura:
> - **disciplinas**: uma lista de disciplinas.
> - Para cada disciplina, inclua:
>     - **nome**: o nome da disciplina. Caso seja informado, utilize o nome informado pelo usuário
>     - **professor**: o nome do professor. Caso seja informado, utilize o nome informado pelo usuário
>     - **aulas**: uma lista de aulas, onde cada aula contém:
>         - **data**: a data da aula. Caso seja informado, utilize o nome informado pelo usuário
>         - **titulo**: o título da aula.
>         - **resumo**: um resumo detalhado da aula, formatado com Markdown, com os tópicos da aula em ordem cronológica. Caso o usuário forneça detalhes sobre a bibliografia da aula, complete as informações com elas, grife pontos importantes que foi dito que cairia ou que deve cair na prova, ou que você considere os pontos-chave da aula, caso haja algum ponto incompleto, realize uma pesquisa objetiva e deixe em um parágrafo dentro do tópico, coloque um aviso que o conteúdo desse parágrafo foi gerado por IA. Caso tenha necessidade, utilize diagramas em mermaid ou códigos em linguagens de programação. tudo que for necessário para facilitar o entendimento do assunto.
>         - **off_topic**: informações sobre assuntos que foram comentados na aula mas que não estão diretamente relacionados ao conteúdo da aula em si. Mas que podem ser considerados algo importante.
>         - **tarefas_futuras**: tarefas e projetos e atividades mencionados para a próxima aula ou para o futuro, incluindo detalhes e descrições. Seja o mais descritivo sobre cada uma das atividades que foram pedidas, caso você tenha essa informação, coloque em negrito a data de entrega de cada uma das atividades.
>         - **datas_futuras_mencionadas**: datas futuras mencionadas para conteúdos diversos, provas, atividades, eventos, projetos (principalmente atividades relacionadas a provas e ao projeto interdisciplinar) apresentações e tudo mais.
>         - **atividades**: Lista de atividades práticas que foram realizadas durante a aula. detalhando o que foi realizado, o que foi pedido, quais arquivos e conteúdos foram utilizados. O que foi dado como atividade e suas revisões
>         - **tags**: palavras-chave relacionadas ao conteúdo da aula. 

### **Modelo de JSON esperado:**

```json
{
  "disciplinas": [
    {
      "nome": "Desenvolvimento Web",
      "professor": "Wilson",
      "aulas": [
        {
          "data": "2025-03-31",
          "titulo": "Introdução ao React",
          "resumo": "### O que é React?\nReact é uma biblioteca JavaScript para construção de interfaces...",
          "off_topic": "### Discussões paralelas\nDurante a aula, o professor comentou sobre a importância do TypeScript no desenvolvimento moderno e como ele pode ajudar a evitar erros em projetos grandes. Além disso, houve uma discussão breve sobre o mercado de trabalho e a crescente demanda por desenvolvedores que saibam React.",
          "tarefas_futuras": {
            "descricao_geral": "O professor passou algumas tarefas para a próxima aula, incluindo um pequeno projeto usando componentes.",
            "detalhes": [
              {
                "titulo": "Criar um contador em React",
                "descricao": "Implementar um contador que aumente e diminua ao clicar nos botões, utilizando o estado do React."
              },
              {
                "titulo": "Estudo sobre o Virtual DOM",
                "descricao": "Pesquisar e escrever um resumo sobre o funcionamento do Virtual DOM e como ele otimiza a renderização."
              }
            ]
          },
          "datas_futuras_mencionadas": [
            {
              "data": "2025-04-07",
              "descricao": "Entrega do projeto prático de React."
            },
            {
              "data": "2025-04-14",
              "descricao": "Prova sobre fundamentos do React e JSX."
            }
          ],
          "tags": ["React", "Componentes", "JSX"]
        }
      ]
    }
  ]
}
```


### **Regras para o modelo**:

Todos os conteúdos devem ser estuturados em Markdown e injetado na estrutura do JSON.

Faça as informações a seguir com a maior riqueza de detalhes para cada um dos tópicos, porém seguindo cada uma das regras abaixo

1. **Resumo da aula (resumo)**: O modelo vai procurar um resumo geral do conteúdo discutido. Esse resumo deve ser em formato Markdown para facilitar a leitura e a organização das ideias. Seja bem detalhalhista aqui e separe tudo em tópicos de acordo com os pontos importantes relatados na aula, quanto mais detalhes relevantes melhor.
  
2. **Discussões off-topic (off_topic)**: A ideia aqui é identificar partes da aula que não estão diretamente relacionadas ao conteúdo central, mas que foram discutidas pelo professor, como outras tecnologias ou questões gerais. Seja detalhista aqui, procure pontos importantes mas que não se relacionam com a aula em si.

3. **Atividades realizadas durante a aula (atividades_em_aula)**: O modelo precisa identificar e descrever as atividades realizadas na aula, incluindo qualquer tipo de exercício ou demonstração prática feita pelos alunos.

4. **Tarefas futuras (tarefas_futuras)**: O modelo vai capturar tarefas, projetos ou estudos que o professor mencionou para serem feitos depois, seja para a próxima aula ou para um futuro mais distante. Coloque em negrito as datas de entrega das atividades caso o modelo consiga identificar a data.

5. **Datas futuras (datas_futuras_mencionadas)**: Caso o professor tenha mencionado datas importantes, como provas ou entrega de projetos, essas datas também devem ser capturadas.

6. **Flashcards (flashcards)**: A partir da transcrição, o modelo vai capturar pontos importantes da aula e gerr flashcards que exemplifiquem temas, tópicos e conteúdos importantes, pontos-chave que foram passados em aula.

7. **Atividades propostas (atividades)**: Além das atividades que já foram realizadas, o modelo deve identificar atividades futuras ou tarefas que foram mencionadas de forma mais geral.

8. **Tags (tags)**: O modelo deve identificar palavras-chave relacionadas ao conteúdo da aula, como frameworks ou conceitos importantes.