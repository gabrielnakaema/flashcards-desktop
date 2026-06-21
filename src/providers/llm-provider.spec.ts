import { describe, expect, it } from "vitest";
import { getLlmProvider } from "./llm-provider";

describe("getLlmProvider", () => {
  it("returns the OpenAI provider", () => {
    const provider = getLlmProvider("openai");

    expect(provider.id).toBe("openai");
  });

  it("throws for unsupported providers", () => {
    expect(() => getLlmProvider("anthropic" as never)).toThrow(
      "Unsupported LLM provider"
    );
  });
});
