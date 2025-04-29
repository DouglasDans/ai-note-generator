export interface NotesDB {
  disciplinas: {
    [key: string]: DisciplinaCollection;
  };
  aulas: {
    [key: string]: AulaCollection;
  };
}

export interface DisciplinaCollection {
  nome: string;
  professor: string;
  id: string;
}

export interface AulaCollection {
  id: string;
  disciplina_id?: string;
  disciplinaId: string;
  title: string;
  data: string;
}
