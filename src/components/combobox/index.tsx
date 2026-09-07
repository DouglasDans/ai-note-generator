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
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
};

// Genérico: sugere as opções já existentes, mas digitar um valor novo
// continua sendo aceito (não trava em lista fechada). Usado pra disciplina
// e professor no formulário de upload.
export default function Combobox({
  id,
  name,
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const trimmedSearch = search.trim();
  const matches = options.filter((option) =>
    option.toLowerCase().includes(trimmedSearch.toLowerCase())
  );
  const isNewValue =
    trimmedSearch.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmedSearch.toLowerCase());

  function select(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSearch(value);
      }}
    >
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
            {value || placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar..." value={search} onValueChange={setSearch} />
          <CommandList>
            {matches.length === 0 && !isNewValue && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            <CommandGroup>
              {matches.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => select(option)}>
                  <Check
                    className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
                </CommandItem>
              ))}
              {isNewValue && (
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
