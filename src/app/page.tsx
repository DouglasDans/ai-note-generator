import { goToSpace } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

// A home não lista nada — modelo Dontpad (ver PLANO.md, decisão 4.1).
// É só a porta de entrada para o space, seja criando ou acessando um já
// existente.
export default async function Home({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AI Note Generator</CardTitle>
          <CardDescription>
            Digite o nome do seu espaço para entrar ou criar um novo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={goToSpace} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="slug">Espaço</Label>
              <Input id="slug" name="slug" type="text" placeholder="ex: fatec-gestao-2026" required />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
        {error && (
          <CardFooter>
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
