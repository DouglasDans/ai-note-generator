"use server";

import db from "@/config/firebase.config";
import { collection, collectionGroup, getDocs } from "firebase/firestore";

export async function getAllDisciplinas() {
  const disciplinasRef = collectionGroup(db, "disciplinas");
  const disciplinasSnapshot = await getDocs(disciplinasRef);
  let disciplinasList: any = [];

  for (const disciplinaDoc of disciplinasSnapshot.docs) {
    let disciplina = disciplinaDoc.data();
    disciplina.id = disciplinaDoc.id;

    disciplinasList.push(disciplina);
  }

  return disciplinasList;
}

export async function getAulaListByDisciplinaId(id: string) {
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
