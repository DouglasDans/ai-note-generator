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
export default function UploadSessionDialog({ spaceSlug, courses }: Props) {
  const [open, setOpen] = useState(false);

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
        <IngestForm spaceSlug={spaceSlug} courses={courses} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
