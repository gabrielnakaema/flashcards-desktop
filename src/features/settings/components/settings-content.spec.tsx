import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import { SettingsContent } from "./settings-content";

const mockListModels = vi.fn();

vi.mock("@/features/llm/providers/llm-provider", () => {
  const providers = {
    openai: {
      id: "openai",
      label: "OpenAI",
      defaultModel: "gpt-4.1-mini",
      listModels: (...args: unknown[]) => mockListModels(...args),
      generateCards: vi.fn(),
    },
    openrouter: {
      id: "openrouter",
      label: "OpenRouter",
      defaultModel: "openrouter/free",
      listModels: (...args: unknown[]) => mockListModels(...args),
      generateCards: vi.fn(),
    },
  } as const;

  return {
    defaultLlmProvider: providers.openai,
    getLlmProvider: (provider: keyof typeof providers) => providers[provider],
    getLlmProviderOptions: () =>
      Object.values(providers).map(({ id, label }) => ({
        label,
        value: id,
      })),
  };
});

describe("SettingsContent", () => {
  it("loads available models with the current API key", async () => {
    mockListModels.mockResolvedValue([
      { label: "gpt-5.4-mini", value: "gpt-5.4-mini" },
    ]);
    const user = userEvent.setup();

    render(<SettingsContent />);

    await user.type(screen.getByLabelText("API Key"), "sk-test");
    await user.click(screen.getByRole("button", { name: /load models/i }));

    await waitFor(() => {
      expect(mockListModels).toHaveBeenCalledWith({ apiKey: "sk-test" });
    });

    await user.click(screen.getByLabelText("Default model"));

    expect(
      await screen.findByRole("option", { name: "gpt-5.4-mini" })
    ).toBeVisible();
  });

  it("selects the fixed free model when OpenRouter is chosen", async () => {
    mockListModels.mockResolvedValue([
      { label: "openrouter/free", value: "openrouter/free" },
    ]);
    const user = userEvent.setup();

    render(<SettingsContent />);

    await user.click(screen.getByLabelText("Default provider"));
    await user.click(await screen.findByRole("option", { name: "OpenRouter" }));

    expect(screen.getByLabelText("Default model")).toHaveTextContent(
      "openrouter/free"
    );
  });
});
