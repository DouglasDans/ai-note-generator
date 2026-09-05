export interface DisciplinaCollection {
  nome: string;
  professor: string;
  id: string;
}

export interface AulaCollection {
  id: string;
  disciplinaId: string;
  title: string;
  data: string;
}
