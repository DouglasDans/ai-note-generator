from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from tinydb import TinyDB, Query
import json
import re

print("Carregando variáveis de ambiente...")
load_dotenv()

with open("./prompt.md", "r", encoding="utf-8") as file:
  input_text = file.read()
prompt_version = "2.5"


client = genai.Client(api_key=os.getenv("API_KEY"))


nome_disciplina = input("Insira o nome da disciplina, caso ela já esteja cadastrada, coloque o nome da disciplina cadastrada\n")
nome_professor = input("Insira o nome do professor, caso já esteja cadastrado, pressione enter\n")
data_aula = input("Insira a data da aula no padrão DD-MM-YYYY\n")


print("Fazendo upload do arquivo de áudio...")
myfile = client.files.upload(file='./file.mp3')


print("Gerando transcrição de áudio...")
response = client.models.generate_content(
  model="gemini-2.5-pro-exp-03-25", 
  config=types.GenerateContentConfig(
    response_mime_type= "application/json",
    system_instruction=input_text
  ),
  contents=[
    myfile, 
    "Usuário informa que a data da aula é: {data_aula}, O nome do professor da aula é: {nome_professor} e a Disiclina da aula é: {nome_disciplina}"
    ]
)
print(response.text)


print("Tratando resposta gerada pela IA")
def extrair_json(texto):
    padrao = re.compile(r'(\{.*\})', re.DOTALL)
    resultado = padrao.search(texto)
    
    if resultado:
        json_str = resultado.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as erro:
            print("Erro ao decodificar JSON:", erro)
    return None

json_response = extrair_json(response.text)
print(json_response)


print("Enviando dados para o JSON...")
def sanitize_firestore_key(key):
    """Remove caracteres inválidos do nome do documento Firestore."""
    key = key.lower().strip()
    key = re.sub(r'[^a-zA-Z0-9_-]', '_', key)
    return key

db = TinyDB('../generated_notes_db.json')

for disciplina in json_response["disciplinas"]:
    disciplina_nome = sanitize_firestore_key(nome_disciplina)
    
    disciplina_table = db.table('disciplinas')
    disciplina_id = disciplina_table.upsert(
        {
            "id": disciplina_nome,
            "nome": nome_disciplina,
            "professor": nome_professor
        }, 
        Query().id == disciplina_nome
    )

    # Inserir aulas
    aulas_table = db.table('aulas')
    for aula in disciplina['aulas']:
        aula_titulo = sanitize_firestore_key(aula['titulo'])
        aulas_table.upsert(
            {
                "id": aula_titulo,
                "disciplina_id": disciplina_nome,
                "prompt_version": prompt_version,
                "data": data_aula,
                "titulo": aula['titulo'],
                "resumo": aula['resumo'],
                "off_topic": aula.get('off_topic', ""),
                "tarefas_futuras": aula.get("tarefas_futuras", {}),
                "datas_futuras_mencionadas": aula.get("datas_futuras_mencionadas", []),
                "atividades_em_aula": aula.get("atividades_em_aula", ""),
                "tags": aula.get("tags", [])
            },
            (Query().id == aula_titulo) & (Query().disciplina_id == disciplina_nome)
        )

print("Aula registrada no JSON com sucesso")