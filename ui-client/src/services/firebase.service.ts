"use server";

import { Aula } from "@/types/JsonResponse";
import db from "@/config/firebase.config";
import { collection, collectionGroup, getDocs } from "firebase/firestore";
import { AulaCollection, DisciplinaCollection } from "@/types/collectionTypes";

export async function getAllDisciplinas(): Promise<
  Array<DisciplinaCollection>
> {
  const disciplinasRef = collectionGroup(db, "disciplinas");
  const disciplinasSnapshot = await getDocs(disciplinasRef);
  const disciplinasList: Array<DisciplinaCollection> = [];

  for (const disciplinaDoc of disciplinasSnapshot.docs) {
    const disciplina: any = disciplinaDoc.data();
    disciplina.id = disciplinaDoc.id;
    disciplinasList.push(disciplina);
  }

  return disciplinasList;
}

export async function getAulaListByDisciplinaId(
  id: string
): Promise<Array<AulaCollection>> {
  const aulasRef = collection(db, `disciplinas/${id}/aulas`);
  const aulasSnapshot = await getDocs(aulasRef);
  let aulas = [];

  aulas = aulasSnapshot.docs.map((aulaDoc) => ({
    id: aulaDoc.id,
    disciplinaId: id,
    title: aulaDoc.data().titulo,
    data: aulaDoc.data().data,
  }));

  return aulas;
}

export async function getAulaDetailsById(
  disciplinaId: string,
  aulaId: string
): Promise<Aula> {
  const aulasRef = collection(db, `disciplinas/${disciplinaId}/aulas`);
  const aulasSnapshot = await getDocs(aulasRef);
  let aulas: Array<any> = [];

  aulas = aulasSnapshot.docs.map((aulaDoc) => {
    if (aulaDoc.id === aulaId) {
      return {
        id: aulaDoc.id,
        ...aulaDoc.data(),
      };
    }
  });

  return aulas[0] || [];
}
