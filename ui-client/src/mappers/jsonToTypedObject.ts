import {
  AulaCollection,
  DisciplinaCollection,
  NotesDB,
} from "@/types/collectionTypes";

export function JSONToDisciplinasCollectionList(
  json: NotesDB
): DisciplinaCollection[] {
  const disciplinas: DisciplinaCollection[] = [];
  const disciplinasObj = json.disciplinas;

  Object.values(disciplinasObj).forEach((disciplina) => {
    if (disciplina) {
      disciplinas.push({
        id: disciplina.id,
        nome: disciplina.nome,
        professor: disciplina.professor,
      });
    }
  });

  return disciplinas;
}

export function JSONToAulasCollectionListByDisciplinaId(
  json: NotesDB,
  disciplina_id: string
): AulaCollection[] {
  const aulas: AulaCollection[] = [];
  const filteredAulas = Object.values(json.aulas).filter(
    (aula) => aula.disciplina_id === disciplina_id
  );

  filteredAulas.forEach((aula) => {
    if (aula) {
      aulas.push({
        id: aula.id,
        data: aula.data,
        disciplinaId: aula.disciplinaId,
        title: aula.title,
      });
    }
  });

  return aulas;
}
