import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IngestForm from "@/components/ingest-form";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

// fireEvent.submit(form) em vez de clicar no botão: jsdom tem uma limitação
// conhecida em que input[type=file] com `required` nunca satisfaz a
// constraint validation nativa mesmo com arquivo anexado, então um clique
// real no submit seria bloqueado silenciosamente antes de disparar o
// onSubmit do React. Despachar o evento direto no form pula essa etapa —
// o mesmo que acontece com requestSubmit(), diferente de form.submit().
async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(["audio-bytes"], "aula.mp3", { type: "audio/mp3" });
  await user.upload(screen.getByLabelText(/áudio/i), file);
  fireEvent.change(screen.getByLabelText(/data da grava/i), {
    target: { value: "2026-03-10" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /enviar/i }).closest("form")!);
}

describe("IngestForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renderiza os campos esperados", () => {
    render(<IngestForm spaceSlug="fatec-2026" courses={[]} onSubmitted={vi.fn()} />);

    expect(screen.getByLabelText(/áudio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data da grava/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/disciplina/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
  });

  it("ao selecionar uma disciplina existente, preenche o professor automaticamente", async () => {
    const user = userEvent.setup();
    render(
      <IngestForm
        spaceSlug="fatec-2026"
        courses={[{ name: "Banco de Dados II", professor: "Profa. Ana Souza" }]}
        onSubmitted={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText(/disciplina/i));
    await user.click(await screen.findByRole("option", { name: "Banco de Dados II" }));

    expect(screen.getByLabelText(/professor/i)).toHaveTextContent("Profa. Ana Souza");
  });

  it("envia POST com FormData correto e chama onSubmitted com o jobId ao receber 202", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    const onSubmitted = vi.fn();

    render(<IngestForm spaceSlug="fatec-2026" courses={[]} onSubmitted={onSubmitted} />);
    await fillAndSubmit(user);

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith("job-1"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/fatec-2026/ingest");
    expect(options?.method).toBe("POST");
    const body = options?.body as FormData;
    expect(body.get("recordingDate")).toBe("2026-03-10");

    expect(screen.getByRole("button", { name: /enviar/i })).not.toBeDisabled();
  });

  it("se a resposta não for 202, mostra erro e não chama onSubmitted", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Space não encontrado." }, 404)
    );
    const onSubmitted = vi.fn();

    render(<IngestForm spaceSlug="fatec-2026" courses={[]} onSubmitted={onSubmitted} />);
    await fillAndSubmit(user);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Space não encontrado.")
    );
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /enviar/i })).not.toBeDisabled();
  });
});
