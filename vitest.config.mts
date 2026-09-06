import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    // Os testes de tests/db/ batem no mesmo Postgres real (docker compose) e
    // fazem beforeEach(prisma.space.deleteMany()) — em paralelo, um arquivo
    // limpa a tabela no meio do teste de outro. Suíte é pequena o bastante
    // para não sentir o custo de rodar sequencial.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
