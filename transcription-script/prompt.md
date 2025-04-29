## **REGRA PRINCIPAL**

- O JSON **deve ser retornado como uma string raw**.  
- **A saída do modelo deve conter apenas e unicamente o JSON.**  
- **Não utilize Markdown, texto explicativo, nem qualquer outro tipo de formatação além do JSON puro.**  
- **Nenhuma informação extra deve ser adicionada antes ou depois do JSON.**  
- **O modelo deve garantir que o JSON seja válido e formatado corretamente.**
- **Após todas as etapas terem sido realizadas, analise suas respostas, verifique se os conteúdos estão corretos e coesos e didáticos**

Modelo de JSON resposta:
```json
{
  "disciplinas": [
    {
      "nome": "",
      "professor": "",
      "aulas": [
        {
          "data": "",
          "titulo": "",
          "resumo": "",
          "off_topic": "",
          "tarefas_futuras": {
            "descricao_geral": "",
            "detalhes": [
              {
                "titulo": "",
                "descricao": ""
              }
            ]
          },
          "datas_futuras_mencionadas": [
            {
              "data": "",
              "descricao": ""
            }
          ],
          "atividades_em_aula": "",
          "tags": []
        }
      ]
    }
  ]
}
```

---

## Instruções Gerais

- **Transcrição Completa:** Transcreva fielmente todo o áudio da aula, capturando os conteúdos, comentários e menções feitas durante a aula.
- Considere que a aula foi realizada na FATEC no ano de 2025. 
- **Estruturação em JSON:** Organize as informações transcritas em um objeto JSON, onde cada atributo possui regras e finalidades específicas, o modelo só deve retornar **APENAS O JSON na estrutura acima** como resposta.
- **Formato Markdown:** Todo o conteúdo (incluindo os resumos, listas, códigos, diagramas, tabelas e outros elementos) deve ser formatado em Markdown para facilitar a leitura e a organização.
- **Organização Sem Repetição:** As informações não devem ser duplicadas entre os atributos. O `resumo` conterá apenas o conteúdo principal da aula, enquanto os demais atributos receberão apenas os dados específicos solicitados.
- **Ferramentas Visuais e Complementares:** Quando necessário, o modelo pode incluir códigos (ex.: SQL ou outras linguagens de programação) e diagramas em Mermaid, estruturação em tabelas para esclarecer conceitos. Se algum conteúdo parecer incompleto ou pouco didático, o modelo poderá realizar uma pesquisa adicional e incluir um parágrafo extra para complementar o entendimento, informando ao final deste parágrafo que o mesmo foi gerado por pesquisa de inteligência artificial.

---

## Estrutura do JSON

### 0. `titulo`
- **Objetivo:** Definir um título claro e representativo para todo o conteúdo da aula.
- **Formato e Regras:**
  - **Título Descritivo:** O título deve refletir o tema principal da aula e ser coerente com o conteúdo ministrado.
  - **Brevidade e Impacto:** Mantenha o título curto, direto e impactante, facilitando a identificação rápida do assunto.

---

### 1. `resumo`
- **Objetivo:** Fornecer um resumo detalhado e estruturado do conteúdo principal da aula.
- **Formato e Regras:**
  - **Tópicos com Títulos:** Divida o resumo em tópicos, onde cada tópico tenha um título que identifique o tema abordado.
  - **Detalhamento Cronológico:** Organize os tópicos na ordem em que os assuntos foram abordados durante a aula.
  - **Conteúdo Rico:** Cada tópico pode incluir:
    - Listas (bullet points ou numeradas)
    - Blocos de código (ex.: SQL ou outras linguagens, com a sintaxe apropriada)
    - Diagramas (por exemplo, utilizando sintaxe Mermaid)
    - Outros elementos Markdown (como citações, links, etc.)
  - **Foco no Conteúdo Principal:** Inclua apenas o conteúdo central e objetivo da aula, removendo detalhes que serão tratados em outros atributos (como tarefas, datas, atividades em aula ou discussões off-topic).

---

### 2. `tarefas_futuras`
- **Objetivo:** Listar todas as tarefas e atividades futuras mencionadas na aula.
- **Formato e Regras:**
  - **Atividades Avaliativas:** Priorize e dê destaque especial a atividades que valem nota, como provas, entregas e avaliações.
  - **Projeto Interdisciplinar (PI):** Se houver menção ao Projeto Interdisciplinar, inclua todos os detalhes, informações, prazos e instruções relacionados.
  - **Outras Tarefas:** Inclua outras atividades futuras ou lembretes, mantendo a distinção clara entre atividades avaliativas e não avaliativas.
  - **Data de Entrega:** Sempre informe em **negrito** a data de entrega da tarefa ao final da descrição. Caso a data não seja informada, utilize **"A Definir"**.


---

### 3. `datas_futuras`
- **Objetivo:** Registrar todas as menções a datas e eventos futuros citados durante a aula.
- **Formato e Regras:**
  - **Eventos e Alterações:** Liste qualquer menção a datas para provas, entregas, eventos, aulas presenciais, ausências ou mudanças no calendário escolar.
  - **Formato de Data:** Sempre que possível, utilize um formato padrão para datas (por exemplo, DD/MM/AAAA) ou conforme mencionado na aula.
  - **Separação Clara:** As datas devem ser listadas separadamente, sem se misturar com o conteúdo principal do resumo.

---

### 4. `discussoes_off_topic`
- **Objetivo:** Capturar informações e comentários que não estejam diretamente relacionados ao conteúdo central da aula.
- **Formato e Regras:**
  - **Conteúdo Diverso:** Inclua dados como:
    - Comentários pessoais do professor.
    - Informações sobre acontecimentos paralelos (ex.: a aula foi interrompida, menções a assuntos não relacionados).
    - Outros comentários que não influenciam o entendimento do conteúdo principal.
  - **Clareza na Separação:** Garanta que essas informações sejam registradas de forma distinta, para evitar confusão com o resumo da aula.

---

### 5. `tags`
- **Objetivo:** Extrair as principais palavras-chave e termos relevantes mencionados durante a aula.
- **Formato e Regras:**
  - **Lista de Palavras-Chave:** Compile uma lista de termos que representem os conceitos centrais, temas abordados, nomes de projetos e quaisquer termos técnicos relevantes.
  - **Utilidade para Pesquisa:** Essas tags devem facilitar futuras pesquisas e estudos relacionados ao conteúdo da aula.
  - **Exclusividade:** As palavras-chave não devem repetir termos já detalhados em outros atributos, mantendo a objetividade e a clareza.

---

### 6. `atividades_em_aula`
- **Objetivo:** Fornecer um resumo específico e focado das atividades práticas realizadas durante a aula.
- **Formato e Regras:**
  - **Resumo Focado:** Extraia e resuma as atividades práticas e novos conteúdos experimentais apresentados em aula, como exercícios e demonstrações.
  - **Destaque para Atividades Práticas:** Dê ênfase especial às atividades realizadas, como:
    - Exercícios aplicados em tempo real.
    - Demonstrações práticas (ex.: criação de consultas SQL, uso de ferramentas, experimentos em código).
    - Instruções práticas dadas pelo professor.
  - **Organização para Pesquisa:** Estruture essa seção de forma que facilite a busca e o estudo posterior, permitindo que o usuário identifique rapidamente o que foi feito e praticado durante a aula.
  - **Sintonia com o Resumo Geral:** Embora o `resumo` contenha o conteúdo principal da aula, esta seção deve concentrar-se exclusivamente nas atividades práticas e exercícios executados, evitando repetir o conteúdo teórico já resumido.

---

## Regras Adicionais

- **Não Duplicar Informações:** O conteúdo do `resumo` deve se concentrar no principal da aula, enquanto as informações específicas de tarefas, datas, atividades práticas e discussões off-topic devem ser segregadas nos seus respectivos atributos.
- **Hierarquia e Clareza:** Cada atributo deve ser apresentado de forma hierárquica, garantindo que as informações estejam bem organizadas e fáceis de localizar.
- **Formatação em Markdown:** Utilize a sintaxe Markdown para títulos, listas e demais elementos, garantindo uma apresentação visualmente clara e estruturada.
- **Utilização de Ferramentas Visuais:** Sempre que necessário para clareza ou complementação do entendimento, o modelo pode inserir códigos (como SQL ou outras linguagens), diagramas em Mermaid ou parágrafos complementares. Caso um parágrafo extra seja gerado para complementar informações e aumentar a didática, este parágrafo deve terminar com a indicação de que foi "gerado por pesquisa de inteligência artificial".
- **Precisão e Detalhamento:** Seja detalhado nas descrições e nas regras, para que o modelo entenda com precisão o que deve ser extraído e como deve ser organizado em cada parte do JSON.

---

Utilize estas diretrizes para que o modelo de inteligência artificial transcreva o áudio da aula e organize as informações de forma precisa, clara e estruturada, atendendo a todos os requisitos mencionados e facilitando o estudo e a pesquisa futura.
