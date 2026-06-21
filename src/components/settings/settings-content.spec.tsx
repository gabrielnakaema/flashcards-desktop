import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import { SettingsContent } from "./settings-content";

const mockListModels = vi.fn();

vi.mock("@/providers/llm-provider", () => ({
  defaultLlmProvider: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1-mini",
  },
  getLlmProvider: () => ({
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1-mini",
    listModels: (...args: unknown[]) => mockListModels(...args),
    generateCards: vi.fn(),
  }),
  getLlmProviderOptions: () => [{ label: "OpenAI", value: "openai" }],
}));

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
});
