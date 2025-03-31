from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials, firestore
import json

print("Carregando variáveis de ambiente...")
load_dotenv()

with open("./prompt.md", "r", encoding="utf-8") as file:
  input_text = file.read()

cred = credentials.Certificate("./firebase.json")
firebase_admin.initialize_app(cred)

client = genai.Client(api_key=os.getenv("API_KEY"))


print("Fazendo Upload do arquivo de áudio...")
myfile = client.files.upload(file='./file.mp3')


print("Gerando trascrição de áudio...")
response = client.models.generate_content(
  model="gemini-2.0-flash", 
  config=types.GenerateContentConfig(
    response_mime_type= "application/json",
    system_instruction=input_text
  ),
  contents=[myfile]
)


print("Convertendo resposta para JSON...")
json_response = json.loads(response.text)

print(json_response)


print("Enviado dados para o Firebase")
db = firestore.client()

for disciplina in json_response["disciplinas"]:
  disciplina_ref = db.collection('disciplinas').document(disciplina['nome'])
    
  for aula in disciplina['aulas']:
    # Inserindo aulas dentro da disciplina
    disciplina_ref.collection('aulas').document(aula['titulo']).set(aula)

print("Aula registrada e cadastrada no Firebase com Sucesso")