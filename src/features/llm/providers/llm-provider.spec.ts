import { describe, expect, it } from "vitest";
import {
  defaultLlmProvider,
  getLlmProvider,
  getLlmProviderOptions,
} from "./llm-provider";

describe("getLlmProvider", () => {
  it("returns the OpenAI provider", () => {
    const provider = getLlmProvider("openai");

    expect(provider.id).toBe("openai");
  });

  it("registers OpenRouter without changing the default provider", () => {
    expect(getLlmProvider("openrouter")).toMatchObject({
      id: "openrouter",
      label: "OpenRouter",
      defaultModel: "openrouter/free",
    });
    expect(getLlmProviderOptions()).toEqual([
      { label: "OpenAI", value: "openai" },
      { label: "OpenRouter", value: "openrouter" },
    ]);
    expect(defaultLlmProvider.id).toBe("openai");
  });

  it("throws for unsupported providers", () => {
    expect(() => getLlmProvider("anthropic" as never)).toThrow(
      "Unsupported LLM provider"
    );
  });
});
