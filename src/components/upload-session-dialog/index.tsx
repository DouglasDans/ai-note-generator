"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import IngestForm from "@/components/ingest-form";
import { useIngestionJobs } from "@/components/ingestion-jobs-provider";

type Course = {
  name: string;
  professor: string;
};

type Props = {
  spaceSlug: string;
  courses: Course[];
};

// Formulário escondido atrás de um botão + modal: a tela do space acumulava
// tudo visível de uma vez (form de upload sempre aberto + próximas entregas
// + disciplinas), feedback do Douglas após navegar na UI de verdade.
//
// O modal fecha assim que o upload é aceito (job criado), não quando a IA
// termina de processar — acompanhar isso é responsabilidade do
// IngestionJobsProvider (global, sobrevive a troca de tela), pra não
// travar o usuário na tela esperando.
export default function UploadSessionDialog({ spaceSlug, courses }: Props) {
  const [open, setOpen] = useState(false);
  const { trackJob } = useIngestionJobs();

  function handleSubmitted(jobId: string) {
    setOpen(false);
    trackJob(spaceSlug, jobId);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" />
          Enviar nova aula
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar nova aula</DialogTitle>
        </DialogHeader>
        <IngestForm spaceSlug={spaceSlug} courses={courses} onSubmitted={handleSubmitted} />
      </DialogContent>
    </Dialog>
  );
}
