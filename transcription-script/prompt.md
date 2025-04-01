# Instruções para o Modelo

A partir da transcrição de áudio da aula, você deve gerar um **JSON** com a estrutura especificada. **Todos os conteúdos devem ser estruturados em Markdown e injetados na estrutura do JSON.**

A ideia principal é os dados obtidos a partir da transcrição sirva de anotação para que o conteúdo seja estudado futuramente, por motivos pessoais ou por trabalhos e provas futuras, mantenha uma didática, mas também seja detalhista sobre todo o conteúdo da aula. então facilite a busca por pontos-chave.

Não é necessário indicar a localização no áudio sobre a transcrição das informações.


## Estrutura do JSON

O JSON deve seguir a estrutura abaixo:

```json
{
  "disciplinas": [
    {
      "nome": "Nome da Disciplina (ou nome informado pelo usuário)",
      "professor": "Nome do Professor (ou nome informado pelo usuário)",
      "aulas": [
        {
          "data": "Data da Aula (ou data informada pelo usuário)",
          "titulo": "Título da Aula",
          "resumo": "### Markdown com resumo detalhado da aula. - Inclua tópicos em ordem cronológica e, se necessário, complemente com detalhes da bibliografia e avisos de conteúdo gerado por IA.",
          "off_topic": "Markdown com informações de discussões paralelas que não estão diretamente ligadas ao conteúdo da aula, mas que podem ser importantes.",
          "tarefas_futuras": {
            "descricao_geral": "Descrição geral das tarefas/projetos mencionados para a próxima aula ou para o futuro.",
            "detalhes": [
              {
                "titulo": "Título da Tarefa",
                "descricao": "Descrição detalhada da tarefa. Coloque em **negrito** a data de entrega, caso identificada."
              }
            ]
          },
          "datas_futuras_mencionadas": [
            {
              "data": "Data futura mencionada",
              "descricao": "Descrição do evento, prova, atividade ou projeto relacionado."
            }
          ],
          "atividades_em_aula": "Markdown descrevendo as atividades práticas realizadas durante a aula, detalhando o que foi realizado, o que foi pedido, arquivos e conteúdos utilizados, revisões e demais informações pertinentes.",
          "tags": ["tag1", "tag2", "..."]
        }
      ]
    }
  ]
}
```

## Regras para a Extração e Organização dos Dados

1. **Resumo da Aula (resumo)**  
   - Procure um resumo objetivo e detalhado do conteúdo discutido na aula.  
   - Utilize formato Markdown, com tópicos organizados cronologicamente e ricos em detalhes, não separe tópicos em listas mas em parágrafos com títulos, fica mais organizado. Mas fique livre para utilizar listas dentro do tópico.
   - Caso haja pontos incompletos ou complexos em um determinado tópico, faça complementos, realize uma pesquisa objetiva com novas informações sobre o tópico e inclua em um novo parágrafo com um aviso informando que o conteúdo foi gerado por IA logo no fim deste parágrafo.
   - Coloque palavras chave em negrito.
   - Caso necessáro, converta códigos em lingagem de programação. exemplifique, quando for possível, não hesite em fazer exemplos visuais, utilizando linguagens de programação ou mermaid.

2. **Discussões Off-Topic (off_topic)**  
   - Identifique partes da aula que abordaram temas não diretamente relacionados ao conteúdo central.  
   - Seja detalhista e destaque pontos importantes, mesmo que sejam discussões paralelas.

3. **Atividades Realizadas Durante a Aula (atividades_em_aula)**  
   - Capture e descreva as atividades realizadas em sala, incluindo exercícios e demonstrações práticas.

4. **Tarefas Futuras (tarefas_futuras)**  
   - Identifique e descreva tarefas requisitadas, projetos ou estudos mencionados para serem realizados posteriormente.  
   - Em cada detalhe, destaque (em **negrito**) as datas de entrega, se informadas, caso não tenha, deixe "A definir" em destaque.

5. **Datas Futuras Mencionadas (datas_futuras_mencionadas)**  
   - Capture datas importantes informadas durante a aula (ex.: entregas, provas, eventos).
   - Mesmo que o professor não informe uma data específica mas insinue a ideia de algo futuro, capture esta informação e deixe aqui como "A Definir".

6. **Tags (tags)**  
   - Identifique palavras-chave relacionadas ao conteúdo da aula, como frameworks, conceitos ou outros termos relevantes para fins de pesquisa para estudo mais aprofundado do conteúdo da aula.
