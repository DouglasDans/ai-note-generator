import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IngestionJobsProvider } from "@/components/ingestion-jobs-provider";
import IngestionJobsIndicator from "@/components/ingestion-jobs-indicator";
import UploadSessionDialog from "@/components/upload-session-dialog";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

// Simula a composição real: IngestionJobsProvider no layout raiz, envolvendo
// o navbar (onde fica o indicador) e a página do space (onde fica o botão de
// upload) — em componentes separados de verdade, não um mesmo elemento.
function renderApp() {
  return render(
    <IngestionJobsProvider>
      <IngestionJobsIndicator />
      <UploadSessionDialog spaceSlug="fatec-2026" courses={[]} />
    </IngestionJobsProvider>
  );
}

// Mesma limitação de fireEvent.submit em vez de clique real documentada em
// ingest-form: input[type=file] required nunca satisfaz a constraint
// validation nativa do jsdom.
async function openDialogAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /enviar nova aula/i }));
  const file = new File(["audio-bytes"], "aula.mp3", { type: "audio/mp3" });
  await user.upload(screen.getByLabelText(/áudio/i), file);
  fireEvent.change(screen.getByLabelText(/data da grava/i), {
    target: { value: "2026-03-10" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /^enviar$/i }).closest("form")!);
}

describe("IngestionJobsProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("fetch", vi.fn());
    toastSuccess.mockReset();
    toastError.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("não mostra o indicador antes de qualquer upload", () => {
    renderApp();

    expect(
      screen.queryByRole("button", { name: /processamento de aulas/i })
    ).not.toBeInTheDocument();
  });

  it("passa a acompanhar o job assim que o upload é aceito, sem esperar a IA terminar", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));

    renderApp();
    await openDialogAndSubmit(user);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /processamento de aulas/i })
      ).toBeInTheDocument()
    );
  });

  it("mostra toast de sucesso e atualiza a página quando o job termina", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "done" }));

    renderApp();
    await openDialogAndSubmit(user);

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("mostra toast de erro com a mensagem já sanitizada pela API quando o job falha", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: "error", errorMessage: "Não foi possível processar o áudio." })
    );

    renderApp();
    await openDialogAndSubmit(user);

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Não foi possível processar o áudio.")
    );
  });

  it("para de pollar depois que o job termina", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ jobId: "job-1" }, 202));
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "done" }));

    renderApp();
    await openDialogAndSubmit(user);

    await vi.advanceTimersByTimeAsync(2000);
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1));

    const callsAfterDone = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterDone);
  });
});
