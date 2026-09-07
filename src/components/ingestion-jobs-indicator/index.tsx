"use client";

import { Bell, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIngestionJobs, type IngestionJob } from "@/components/ingestion-jobs-provider";

const STATUS_LABEL: Record<IngestionJob["status"], string> = {
  pending: "Na fila",
  processing: "Processando",
  done: "Concluído",
  error: "Falhou",
};

type Props = {
  spaceSlug: string | null;
};

// Rastreamento fica no IngestionJobsProvider (global, sobrevive a troca de
// tela — ver Fase 5i), mas o que aparece aqui é filtrado pro space atual:
// mostrar job de outro space vazaria informação entre "turmas", quebrando o
// isolamento que o resto do projeto segue (decisão 4.1, PLANO.md). Fora de
// um space não há o que mostrar.
export default function IngestionJobsIndicator({ spaceSlug }: Props) {
  const { jobs: allJobs } = useIngestionJobs();

  if (!spaceSlug) return null;

  const jobs = allJobs.filter((job) => job.spaceSlug === spaceSlug);
  if (jobs.length === 0) return null;

  const activeCount = jobs.filter(
    (job) => job.status === "pending" || job.status === "processing"
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Processamento de aulas"
        >
          {activeCount > 0 ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Bell className="size-4" />
          )}
          {activeCount > 0 && (
            <Badge className="absolute -top-1 -right-1 size-4 justify-center p-0 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Processamento de aulas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {jobs.map((job) => (
          <DropdownMenuItem
            key={job.id}
            className="flex flex-col items-start gap-0.5"
            onSelect={(event) => event.preventDefault()}
          >
            <span className="flex items-center gap-1.5 text-sm">
              {job.status === "done" && (
                <CircleCheck className="size-3.5 text-green-600 dark:text-green-400" />
              )}
              {job.status === "error" && <CircleX className="size-3.5 text-destructive" />}
              {(job.status === "pending" || job.status === "processing") && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              {STATUS_LABEL[job.status]}
            </span>
            {job.status === "error" && job.errorMessage && (
              <span className="text-xs text-muted-foreground">{job.errorMessage}</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
