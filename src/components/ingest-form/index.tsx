"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DisciplineCombobox from "@/components/discipline-combobox";

type Props = {
  spaceSlug: string;
  disciplines: string[];
  onDone?: () => void;
};

type IngestJobStatus = "pending" | "processing" | "done" | "error";

const POLL_INTERVAL_MS = 2000;

export default function IngestForm({ spaceSlug, disciplines, onDone }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        <DisciplineCombobox
          id="courseName"
          name="courseName"
          disciplines={disciplines}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="professorName">Professor (opcional)</Label>
        <Input id="professorName" name="professorName" type="text" disabled={isSubmitting} />
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
