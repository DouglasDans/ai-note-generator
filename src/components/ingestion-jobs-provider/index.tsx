"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type IngestionJob = {
  id: string;
  spaceSlug: string;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string | null;
};

type IngestionJobsContextValue = {
  jobs: IngestionJob[];
  trackJob: (spaceSlug: string, jobId: string) => void;
};

const IngestionJobsContext = createContext<IngestionJobsContextValue | null>(null);

const POLL_INTERVAL_MS = 2000;

// No layout raiz (não numa página específica) de propósito: um job de
// processamento sobrevive a navegar pra outra tela — só desmonta se o app
// inteiro desmontar. Sem isso, sair da página do space enquanto processa
// derruba o polling e o indicador some (achado do Douglas navegando de
// verdade).
export function IngestionJobsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const intervalsRef = useRef(new Map<string, ReturnType<typeof setInterval>>());

  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      for (const interval of intervals.values()) clearInterval(interval);
    };
  }, []);

  function updateJob(jobId: string, patch: Partial<IngestionJob>) {
    setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, ...patch } : job)));
  }

  function stopTracking(jobId: string) {
    const interval = intervalsRef.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(jobId);
    }
  }

  function trackJob(spaceSlug: string, jobId: string) {
    setJobs((prev) => [...prev, { id: jobId, spaceSlug, status: "pending" }]);

    const interval = setInterval(async () => {
      const response = await fetch(`/api/${spaceSlug}/ingest/${jobId}`);
      const data: { status: IngestionJob["status"]; errorMessage?: string | null } =
        await response.json();

      if (data.status === "done") {
        stopTracking(jobId);
        updateJob(jobId, { status: "done" });
        toast.success("Aula processada com sucesso.");
        router.refresh();
      } else if (data.status === "error") {
        stopTracking(jobId);
        updateJob(jobId, { status: "error", errorMessage: data.errorMessage });
        toast.error(data.errorMessage ?? "Falha ao processar áudio.");
      } else {
        updateJob(jobId, { status: data.status });
      }
    }, POLL_INTERVAL_MS);

    intervalsRef.current.set(jobId, interval);
  }

  return (
    <IngestionJobsContext.Provider value={{ jobs, trackJob }}>
      {children}
    </IngestionJobsContext.Provider>
  );
}

export function useIngestionJobs() {
  const context = useContext(IngestionJobsContext);
  if (!context) {
    throw new Error("useIngestionJobs precisa estar dentro de um IngestionJobsProvider.");
  }
  return context;
}
