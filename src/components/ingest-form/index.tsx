"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Combobox from "@/components/combobox";

type Course = {
  name: string;
  professor: string;
};

type Props = {
  spaceSlug: string;
  courses: Course[];
  onSubmitted: (jobId: string) => void;
};

// Só cuida do envio em si (POST -> jobId). Acompanhar o processamento até
// done/error é responsabilidade de quem chama (SpaceUploadArea) — o
// usuário não fica mais travado nessa tela esperando a IA terminar.
export default function IngestForm({ spaceSlug, courses, onSubmitted }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState("");
  const [professor, setProfessor] = useState("");

  const disciplineOptions = courses.map((course) => course.name);
  const professorOptions = [...new Set(courses.map((course) => course.professor))];

  // Escolher uma disciplina já cadastrada preenche o professor dela — o
  // vínculo já existe no banco (Course.professor), sem motivo pra pedir de
  // novo. Continua editável depois: não é um valor travado.
  function handleDisciplineChange(next: string) {
    setDiscipline(next);
    const matchedCourse = courses.find((course) => course.name === next);
    if (matchedCourse) {
      setProfessor(matchedCourse.professor);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/${spaceSlug}/ingest`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data: { error?: string } = await response.json();
      setIsSubmitting(false);
      setErrorMessage(data.error ?? "Falha ao enviar áudio.");
      return;
    }

    const { jobId }: { jobId: string } = await response.json();
    setIsSubmitting(false);
    onSubmitted(jobId);
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <Label htmlFor="audio">Áudio da aula</Label>
        <Input id="audio" name="audio" type="file" accept="audio/*" required disabled={isSubmitting} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="recordingDate">Data da gravação</Label>
        <Input id="recordingDate" name="recordingDate" type="date" required disabled={isSubmitting} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="courseName">Disciplina (opcional)</Label>
        <Combobox
          id="courseName"
          name="courseName"
          options={disciplineOptions}
          value={discipline}
          onValueChange={handleDisciplineChange}
          placeholder="Selecione ou digite uma disciplina"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="professorName">Professor (opcional)</Label>
        <Combobox
          id="professorName"
          name="professorName"
          options={professorOptions}
          value={professor}
          onValueChange={setProfessor}
          placeholder="Selecione ou digite um professor"
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar"}
      </Button>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
