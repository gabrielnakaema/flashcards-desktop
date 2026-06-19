import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/test-utils";
import { clearDevClock } from "@/lib/dev-clock";
import { DevStudyTools } from "./dev-study-tools";

const { mockResetDeckStudyProgress, mockUseResetDeckStudyProgress } =
  vi.hoisted(() => ({
    mockResetDeckStudyProgress: vi.fn(),
    mockUseResetDeckStudyProgress: vi.fn(),
  }));

vi.mock("@/hooks/study/use-reset-deck-study-progress", () => ({
  useResetDeckStudyProgress: (deckId: string) => {
    mockUseResetDeckStudyProgress(deckId);
    return {
      resetDeckStudyProgress: mockResetDeckStudyProgress,
      isPending: false,
      error: null,
    };
  },
}));

const DECK_ID = "deck-1";

const setup = () => {
  const user = userEvent.setup();
  render(<DevStudyTools deckId={DECK_ID} />);
  return { user };
};

beforeEach(() => {
  vi.clearAllMocks();
  clearDevClock();
  localStorage.removeItem("flashcards:dev-clock-now");
  mockResetDeckStudyProgress.mockResolvedValue(undefined);
});

afterEach(() => {
  clearDevClock();
});

describe("DevStudyTools", () => {
  it("renders reset and clock controls", () => {
    setup();

    expect(screen.getByLabelText("Developer study tools")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom time")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset study progress/i })
    ).toBeInTheDocument();
  });

  it("confirms and resets study progress for the current deck", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: /reset study progress/i })
    );
    await user.click(screen.getByRole("button", { name: /reset progress/i }));

    await waitFor(() => {
      expect(mockUseResetDeckStudyProgress).toHaveBeenCalledWith(DECK_ID);
      expect(mockResetDeckStudyProgress).toHaveBeenCalledWith();
    });
  });

  it("minimizes and restores the panel", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: /minimize developer study tools/i,
      })
    );

    expect(
      screen.queryByLabelText("Developer study tools")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show dev tools/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show dev tools/i }));

    expect(screen.getByLabelText("Developer study tools")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom time")).toBeInTheDocument();
  });

  it("sets, advances, persists, and clears the dev clock", async () => {
    const { user } = setup();

    const input = screen.getByLabelText("Custom time");
    await user.clear(input);
    await user.type(input, "2026-06-18T12:00");
    await user.click(screen.getByRole("button", { name: /^set$/i }));

    const firstStoredTime = localStorage.getItem("flashcards:dev-clock-now");
    expect(firstStoredTime).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /\+1d/i }));
    const advancedStoredTime = localStorage.getItem("flashcards:dev-clock-now");
    expect(advancedStoredTime).not.toBeNull();
    expect(Date.parse(advancedStoredTime!) - Date.parse(firstStoredTime!)).toBe(
      24 * 60 * 60 * 1000
    );

    await user.click(screen.getByRole("button", { name: /real time/i }));
    expect(localStorage.getItem("flashcards:dev-clock-now")).toBeNull();
  });

  it("keeps real time active when Set is clicked with an empty time", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /real time/i }));
    await user.click(screen.getByRole("button", { name: /^set$/i }));

    expect(localStorage.getItem("flashcards:dev-clock-now")).toBeNull();
    expect(
      screen.queryByText("Enter a valid date and time.")
    ).not.toBeInTheDocument();
  });
});
