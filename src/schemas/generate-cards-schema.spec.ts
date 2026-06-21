import { describe, expect, it } from "vitest";
import { generateCardsSchema } from "./generate-cards-schema";

const validInput = {
  provider: "openai",
  systemPrompt: "You are a helpful assistant.",
  prompt: "Generate 10 flashcards.",
  apiKey: "sk-abc123",
};

describe("generateCardsSchema", () => {
  it("accepts all four required fields present and non-empty", () => {
    const result = generateCardsSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects unsupported providers", () => {
    const result = generateCardsSchema.safeParse({
      ...validInput,
      provider: "anthropic",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path).flat();
    expect(paths).toContain("provider");
  });

  it("rejects an empty systemPrompt", () => {
    const result = generateCardsSchema.safeParse({
      ...validInput,
      systemPrompt: "",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path).flat();
    expect(paths).toContain("systemPrompt");
  });

  it("rejects an empty prompt", () => {
    const result = generateCardsSchema.safeParse({
      ...validInput,
      prompt: "",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path).flat();
    expect(paths).toContain("prompt");
  });

  it("rejects an empty apiKey", () => {
    const result = generateCardsSchema.safeParse({
      ...validInput,
      apiKey: "",
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path).flat();
    expect(paths).toContain("apiKey");
  });
});
