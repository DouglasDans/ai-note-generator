import { goToSpace } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

// A home não lista nada — modelo Dontpad (ver PLANO.md, decisão 4.1).
// É só a porta de entrada para o space, seja criando ou acessando um já
// existente.
export default async function Home({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main>
      <h1>AI Note Generator</h1>
      <p>Digite o nome do seu espaço para entrar ou criar um novo.</p>
      <form action={goToSpace}>
        <input
          type="text"
          name="slug"
          placeholder="ex: fatec-gestao-2026"
          required
        />
        <button type="submit">Entrar</button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
