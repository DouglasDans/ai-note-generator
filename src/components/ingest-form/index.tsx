"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.scss";

type Props = {
  spaceSlug: string;
};

type IngestJobStatus = "pending" | "processing" | "done" | "error";

const POLL_INTERVAL_MS = 2000;

export default function IngestForm({ spaceSlug }: Props) {
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
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="audio">Áudio da aula</label>
        <input id="audio" name="audio" type="file" accept="audio/*" required disabled={isSubmitting} />
      </div>

      <div className={styles.field}>
        <label htmlFor="recordingDate">Data da gravação</label>
        <input
          id="recordingDate"
          name="recordingDate"
          type="date"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="courseName">Curso (opcional)</label>
        <input id="courseName" name="courseName" type="text" disabled={isSubmitting} />
      </div>

      <div className={styles.field}>
        <label htmlFor="professorName">Professor (opcional)</label>
        <input id="professorName" name="professorName" type="text" disabled={isSubmitting} />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processando..." : "Enviar"}
      </button>

      {errorMessage && <p role="alert">{errorMessage}</p>}
    </form>
  );
}
