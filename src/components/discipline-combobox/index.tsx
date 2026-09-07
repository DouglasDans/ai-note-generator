"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  name: string;
  disciplines: string[];
  disabled?: boolean;
};

// Não é um select fechado: sugere as disciplinas já existentes nesse space
// pra evitar duplicação por nome digitado diferente ("Banco de Dados II" vs
// "Banco de Dados 2"), mas digitar um nome novo continua criando disciplina
// nova — mesmo comportamento que o campo de texto livre já tinha.
export default function DisciplineCombobox({ id, name, disciplines, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");

  const trimmedSearch = search.trim();
  const matches = disciplines.filter((discipline) =>
    discipline.toLowerCase().includes(trimmedSearch.toLowerCase())
  );
  const isNewDiscipline =
    trimmedSearch.length > 0 &&
    !disciplines.some((d) => d.toLowerCase() === trimmedSearch.toLowerCase());

  function select(next: string) {
    setValue(next);
    setSearch(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || "Selecione ou digite uma disciplina"}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar disciplina..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {matches.length === 0 && !isNewDiscipline && (
              <CommandEmpty>Nenhuma disciplina encontrada.</CommandEmpty>
            )}
            <CommandGroup>
              {matches.map((discipline) => (
                <CommandItem
                  key={discipline}
                  value={discipline}
                  onSelect={() => select(discipline)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === discipline ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {discipline}
                </CommandItem>
              ))}
              {isNewDiscipline && (
                <CommandItem value={trimmedSearch} onSelect={() => select(trimmedSearch)}>
                  Criar &quot;{trimmedSearch}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
