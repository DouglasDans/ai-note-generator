"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  onDone?: () => void;
};

type IngestJobStatus = "pending" | "processing" | "done" | "error";

const POLL_INTERVAL_MS = 2000;

export default function IngestForm({ spaceSlug, courses, onDone }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState("");
  const [professor, setProfessor] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  function pollJobStatus(jobId: string) {
    pollIntervalRef.current = setInterval(async () => {
      const response = await fetch(`/api/${spaceSlug}/ingest/${jobId}`);
      const data: { status: IngestJobStatus; errorMessage?: string | null } =
        await response.json();

      if (data.status === "done") {
        stopPolling();
        onDone?.();
        router.push(`/${spaceSlug}`);
        router.refresh();
      } else if (data.status === "error") {
        stopPolling();
        setIsSubmitting(false);
        setErrorMessage(data.errorMessage ?? "Falha ao processar áudio.");
      }
    }, POLL_INTERVAL_MS);
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
    pollJobStatus(jobId);
  }

  return (
    <form ref={formRef} className="grid gap-4" onSubmit={handleSubmit}>
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
        {isSubmitting ? "Processando..." : "Enviar"}
      </Button>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
