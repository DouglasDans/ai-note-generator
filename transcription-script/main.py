from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, firestore
import json
import re

print("carregando variáveis de ambiente...")
load_dotenv()

with open("./prompt.md", "r", encoding="utf-8") as file:
  input_text = file.read()

cred = credentials.Certificate("./firebase.json")
firebase_admin.initialize_app(cred)

client = genai.Client(api_key=os.getenv("API_KEY"))


nome_disciplina = input("insira o nome da disciplina, caso ela já esteja cadastrada, coloque o nome da disciplina cadastrada\n")
nome_professor = input("insira o nome do professor, caso já esteja cadastrado, pressione enter\n")
data_aula = input("insira a data da aula no padrão DD-MM-YYYY\n")


print("fazendo upload do arquivo de áudio...")
myfile = client.files.upload(file='./file.mp3')


print("gerando transcrição de áudio...")
response = client.models.generate_content(
  model="gemini-2.5-pro-exp-03-25", 
  config=types.GenerateContentConfig(
    response_mime_type= "application/json",
    system_instruction=input_text
  ),
  contents=[myfile]
)


print("convertendo resposta para JSON...")
json_response = json.loads(response.text)

# print(json_response)

def sanitize_firestore_key(key):
    """Remove caracteres inválidos do nome do documento Firestore."""
    key = key.lower().strip()
    key = re.sub(r'[^a-zA-Z0-9_-]', '_', key)
    return key


print("enviando dados para o Firebase...")
db = firestore.client()

for disciplina in json_response["disciplinas"]:
    disciplina_nome = sanitize_firestore_key(nome_disciplina)
    
    disciplina_ref = db.collection('disciplinas').document(disciplina_nome)
    disciplina_ref.set({
        "nome": nome_disciplina,
        "professor": nome_professor
    })

    for aula in disciplina['aulas']:
        aula_titulo = sanitize_firestore_key(aula['titulo'])
        aula_ref = disciplina_ref.collection('aulas').document(aula_titulo)
        
        aula_ref.set({
            "data": data_aula,
            "titulo": aula['titulo'],
            "resumo": aula['resumo'],
            "off_topic": aula.get('off_topic', ""),
            "tarefas_futuras": aula.get("tarefas_futuras", {}),
            "datas_futuras_mencionadas": aula.get("datas_futuras_mencionadas", []),
            "atividades_em_aula": aula.get("atividades_em_aula", ""),
            "tags": aula.get("tags", [])
        })

print("aula registrada no Firebase com sucesso")