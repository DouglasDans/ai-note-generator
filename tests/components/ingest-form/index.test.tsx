import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IngestForm from "@/components/ingest-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("renderiza os campos esperados", () => {
    render(<IngestForm spaceSlug="fatec-2026" />);

    expect(screen.getByLabelText(/áudio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data da grava/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/curso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
  });

  it("envia POST com FormData correto e inicia polling ao receber 202", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "processing" }));

    render(<IngestForm spaceSlug="fatec-2026" />);
    await fillAndSubmit(user);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/fatec-2026/ingest");
    expect(options?.method).toBe("POST");
    const body = options?.body as FormData;
    expect(body.get("recordingDate")).toBe("2026-03-10");
    // Não inspeciona o File dentro do FormData: user-event simula
    // input.files só no wrapper do elemento, e o construtor nativo
    // `new FormData(form)` do jsdom lê o objeto impl interno, que não é
    // atualizado por esse mock — sempre extrai um File vazio em teste,
    // mesmo com o upload correto no DOM (verificado abaixo). Limitação
    // documentada do jsdom, não do componente; fechada pela verificação
    // manual no navegador antes do commit.
    expect(
      (screen.getByLabelText(/áudio/i) as HTMLInputElement).files?.[0]?.name
    ).toBe("aula.mp3");

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/fatec-2026/ingest/job-1");
  });

  it("ao concluir (done), redireciona pro space e para de pollar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "done" }));

    render(<IngestForm spaceSlug="fatec-2026" />);
    await fillAndSubmit(user);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/fatec-2026"));
    expect(mockRefresh).toHaveBeenCalled();

    const callsAfterDone = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(4000);
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterDone);
  });

  it("ao falhar (error), mostra a mensagem e reabilita o formulário", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: "error", errorMessage: "Falha ao processar áudio." })
    );

    render(<IngestForm spaceSlug="fatec-2026" />);
    await fillAndSubmit(user);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Falha ao processar áudio.")
    );
    expect(screen.getByRole("button", { name: /enviar/i })).not.toBeDisabled();
  });

  it("se a resposta inicial não for 202, mostra erro e não inicia polling", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Space não encontrado." }, 404)
    );

    render(<IngestForm spaceSlug="fatec-2026" />);
    await fillAndSubmit(user);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Space não encontrado.")
    );

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
