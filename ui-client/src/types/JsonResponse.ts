interface Disciplina {
  id?: string;
  nome: string;
  professor: string;
  aulas?: Aula[];
}

export interface Aula {
  id?: string;
  data: string;
  titulo: string;
  resumo: string;
  off_topic: string;
  tarefas_futuras: TarefasFuturas;
  datas_futuras_mencionadas: DataFutura[];
  atividades_em_aula: string;
  tags: string[];
}

interface TarefasFuturas {
  descricao_geral: string;
  detalhes: TarefaDetalhe[];
}

interface TarefaDetalhe {
  titulo: string;
  descricao: string;
}

interface DataFutura {
  data: string;
  descricao: string;
}

export interface Disciplinas {
  disciplinas: Disciplina[];
}
