import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

describe("test harness", () => {
  it("renders React into jsdom with jest-dom matchers available", () => {
    render(<h1>AI Note Generator</h1>);

    expect(
      screen.getByRole("heading", { name: "AI Note Generator" })
    ).toBeInTheDocument();
  });
});
