import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { config } from "dotenv";

// Sem `test.globals: true` no vitest.config.mts, o auto-cleanup do Testing
// Library entre testes não é detectado — sem isso, cada render() num mesmo
// arquivo empilha DOM sobre o anterior em vez de desmontar.
afterEach(cleanup);

// Precisa rodar (com override) antes de qualquer módulo dar `import
// "dotenv/config"` (ex.: src/db/client.ts), que carrega .env sem override —
// por padrão o dotenv não sobrescreve uma env var já definida, então isso
// garante que os testes usem o banco de teste, não o de desenvolvimento.
// Sem isso, os testes de tests/db/ (beforeEach com deleteMany) apagam
// silenciosamente dado de dev criado na mão no mesmo Postgres.
config({ path: ".env.test", override: true });
