import { describe, expect, it } from "vitest";
import { generateWriteSecret } from "./secret";

describe("generateWriteSecret", () => {
  it("generates a URL-safe string with no padding characters", () => {
    const secret = generateWriteSecret();

    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates a different secret on every call", () => {
    const secrets = new Set(
      Array.from({ length: 20 }, () => generateWriteSecret())
    );

    expect(secrets.size).toBe(20);
  });
});
