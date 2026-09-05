import { Type, type Schema } from "@google/genai";

const tarefaDetalheSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING },
    descricao: { type: Type.STRING },
  },
  required: ["titulo", "descricao"],
};

const tarefasFuturasSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    descricao_geral: { type: Type.STRING },
    detalhes: { type: Type.ARRAY, items: tarefaDetalheSchema },
  },
  required: ["descricao_geral", "detalhes"],
};

const dataFuturaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data: { type: Type.STRING },
    descricao: { type: Type.STRING },
  },
  required: ["data", "descricao"],
};

const aulaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING },
    data: { type: Type.STRING },
    resumo: { type: Type.STRING },
    off_topic: { type: Type.STRING },
    tarefas_futuras: tarefasFuturasSchema,
    datas_futuras_mencionadas: { type: Type.ARRAY, items: dataFuturaSchema },
    atividades_em_aula: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "titulo",
    "data",
    "resumo",
    "off_topic",
    "tarefas_futuras",
    "datas_futuras_mencionadas",
    "atividades_em_aula",
    "tags",
  ],
};

const disciplinaSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nome: { type: Type.STRING },
    professor: { type: Type.STRING },
    aulas: { type: Type.ARRAY, items: aulaSchema },
  },
  required: ["nome", "professor", "aulas"],
};

export const AULA_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    disciplinas: { type: Type.ARRAY, items: disciplinaSchema },
  },
  required: ["disciplinas"],
};
