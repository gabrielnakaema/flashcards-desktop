import { render, screen, waitFor, within } from "@/test-utils";
import type { CardWithSchedule, ReviewLog } from "@/features/cards";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudyScreen } from "./study-screen";

const mockGetDeck = vi.fn();
const mockGetDueCards = vi.fn();
const mockSubmitReview = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useCanGoBack: () => true,
  useRouter: () => ({
    history: {
      back: vi.fn(),
    },
    navigate: vi.fn(),
  }),
}));

vi.mock("@/data/repositories", () => ({
  deckRepository: {
    getDeck: (...args: unknown[]) => mockGetDeck(...args),
  },
  studyRepository: {
    getDueCards: (...args: unknown[]) => mockGetDueCards(...args),
    submitReview: (...args: unknown[]) => mockSubmitReview(...args),
  },
}));

const DECK_ID = "deck-1";

const baseSchedule: CardWithSchedule["schedule"] = {
  cardId: "card-1",
  state: "new",
  dueAt: "2024-01-01T00:00:00.000Z",
  intervalDays: 0,
  easeFactor: 2.5,
  repetitionCount: 0,
  lapseCount: 0,
  lastReviewedAt: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const makePlainCard = (
  overrides: Partial<CardWithSchedule> = {},
): CardWithSchedule =>
  ({
    id: "plain-1",
    deckId: DECK_ID,
    type: "plain",
    front: "What is gravity?",
    back: "A force",
    content: {},
    hint: "Think physics",
    explanation: "Gravity attracts masses.",
    sourceExcerpt: null,
    difficulty: null,
    tags: ["science"],
    isSuspended: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    schedule: { ...baseSchedule, cardId: "plain-1" },
    ...overrides,
  }) as CardWithSchedule;

const makeTypedCard = (
  overrides: Partial<CardWithSchedule> = {},
): CardWithSchedule =>
  ({
    id: "typed-1",
    deckId: DECK_ID,
    type: "typed_answer",
    front: "Capital of France?",
    back: null,
    content: {
      acceptedAnswer: "Paris",
      aliases: ["City of Paris"],
    },
    hint: null,
    explanation: "Paris is the capital city.",
    sourceExcerpt: null,
    difficulty: null,
    tags: ["geography"],
    isSuspended: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    schedule: { ...baseSchedule, cardId: "typed-1" },
    ...overrides,
  }) as CardWithSchedule;

const makeChoiceCard = (
  overrides: Partial<CardWithSchedule> = {},
): CardWithSchedule =>
  ({
    id: "choice-1",
    deckId: DECK_ID,
    type: "multiple_choice",
    front: "Largest planet?",
    back: null,
    content: {
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "b",
    },
    hint: null,
    explanation: null,
    sourceExcerpt: null,
    difficulty: null,
    tags: ["space"],
    isSuspended: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    schedule: { ...baseSchedule, cardId: "choice-1", state: "review" },
    ...overrides,
  }) as CardWithSchedule;

const makeReviewLog = (overrides: Partial<ReviewLog> = {}): ReviewLog => ({
  id: "review-1",
  cardId: "typed-1",
  deckId: DECK_ID,
  rating: "good",
  response: null,
  wasCorrect: null,
  reviewedAt: "2024-01-01T00:00:00.000Z",
  previousDueAt: "2024-01-01T00:00:00.000Z",
  nextDueAt: "2024-01-02T00:00:00.000Z",
  elapsedMs: 100,
  ...overrides,
});

function setup(cards: CardWithSchedule[] = [makeTypedCard()]) {
  const user = userEvent.setup();
  mockGetDueCards.mockResolvedValue(cards);
  render(<StudyScreen deckId={DECK_ID} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDeck.mockResolvedValue({
    id: DECK_ID,
    title: "Study Deck",
    tags: [],
    category: { id: "cat-1", name: "Category" },
  });
  mockSubmitReview.mockResolvedValue(makeReviewLog());
});

describe("StudyScreen", () => {
  it("shows a loading state while due cards load", () => {
    mockGetDueCards.mockReturnValue(new Promise(() => {}));
    render(<StudyScreen deckId={DECK_ID} />);
    expect(
      screen.getByRole("status", { name: /loading study session/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no due cards", async () => {
    setup([]);
    expect(await screen.findByText("No due cards")).toBeInTheDocument();
  });

  it("reveals typed-answer correctness and submits review payload", async () => {
    const { user } = setup([makeTypedCard()]);

    expect(await screen.findByText("Capital of France?")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "Paris");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Accepted answer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: "typed-1",
          deckId: DECK_ID,
          rating: "good",
          response: "Paris",
          wasCorrect: true,
          elapsedMs: expect.any(Number),
        }),
      );
    });
    expect(
      await screen.findByText("Study session complete"),
    ).toBeInTheDocument();
  });

  it("reveals multiple-choice correctness and submits computed result", async () => {
    const { user } = setup([makeChoiceCard()]);

    expect(await screen.findByText("Largest planet?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /jupiter/i }));

    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jupiter/i })).toHaveClass(
      "study-correct-pop",
      "disabled:opacity-100",
    );
    expect(screen.getByRole("button", { name: /earth/i })).not.toHaveClass(
      "study-enter",
      "disabled:opacity-100",
    );

    await user.click(screen.getByRole("button", { name: /^easy$/i }));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: "choice-1",
          rating: "easy",
          response: "Jupiter",
          wasCorrect: true,
        }),
      );
    });
  });

  it("reveals plain-card answer and rating options", async () => {
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show answer/i }));

    expect(screen.getByText("A force")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^again$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^easy$/i })).toBeInTheDocument();
  });

  it("reveals an unrevealed plain-card answer with Space", async () => {
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.keyboard("[Space]");

    expect(screen.getByText("A force")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^again$/i }),
    ).toBeInTheDocument();
  });

  it.each([
    ["1", "again"],
    ["2", "hard"],
    ["3", "good"],
    ["4", "easy"],
  ] as const)(
    "submits the %s rating shortcut after reveal",
    async (shortcut, rating) => {
      const { user } = setup([makePlainCard()]);

      expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /show answer/i }));
      await user.keyboard(shortcut);

      await waitFor(() => {
        expect(mockSubmitReview).toHaveBeenCalledWith(
          expect.objectContaining({
            cardId: "plain-1",
            rating,
          }),
        );
      });
    },
  );

  it("selects a single-letter multiple-choice shortcut case-insensitively", async () => {
    const { user } = setup([makeChoiceCard()]);

    expect(await screen.findByText("Largest planet?")).toBeInTheDocument();
    await user.keyboard("B");

    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jupiter/i })).toBeDisabled();
  });

  it("keeps rating shortcuts active after clicking a choice button", async () => {
    const { user } = setup([makeChoiceCard()]);

    expect(await screen.findByText("Largest planet?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /jupiter/i }));
    await user.keyboard("4");

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: "choice-1",
          rating: "easy",
        }),
      );
    });
  });

  it("ignores study shortcuts while the typed-answer input is focused", async () => {
    const { user } = setup([makeTypedCard()]);

    const input = await screen.findByLabelText("Your answer");
    await user.click(input);
    await user.keyboard("1");

    expect(input).toHaveValue("1");
    expect(screen.queryByText("Accepted answer")).not.toBeInTheDocument();
    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("opens keyboard shortcut help from the bottom action bar", async () => {
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /keyboard shortcuts/i }),
    );

    const shortcutList = screen.getByRole("list", {
      name: /available keyboard shortcuts/i,
    });

    expect(within(shortcutList).getByText("Show answer")).toBeInTheDocument();
    expect(within(shortcutList).getByText("Space")).toBeInTheDocument();
  });

  it("marks I don't know as incorrect and supports rating submission", async () => {
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /i don't know/i }));
    await user.click(screen.getByRole("button", { name: /^again$/i }));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: "plain-1",
          rating: "again",
          wasCorrect: false,
        }),
      );
    });
  });

  it("advances the queue after review and summarizes the final session", async () => {
    const { user } = setup([makePlainCard(), makeTypedCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    expect(await screen.findByText("Capital of France?")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "Paris");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await user.click(screen.getByRole("button", { name: /^easy$/i }));

    expect(
      await screen.findByText("Study session complete"),
    ).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("keeps the current card visible when review submission fails", async () => {
    mockSubmitReview.mockRejectedValue(new Error("Could not save review"));
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not save review",
    );
    expect(screen.getByText("What is gravity?")).toBeInTheDocument();
  });

  it("shows review submission errors directly below the flashcard", async () => {
    mockSubmitReview.mockRejectedValue(new Error("Could not save review"));
    const { user } = setup([makePlainCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    const flashcard = screen.getByText("What is gravity?").closest("article");
    const error = await screen.findByRole("alert");

    expect(error).toHaveTextContent("Could not save review");
    expect(flashcard?.nextElementSibling).toBe(error);
  });

  it("advances plain cards immediately after rating click while saving", async () => {
    mockSubmitReview.mockReturnValue(new Promise(() => {}));
    const { user } = setup([makePlainCard(), makeTypedCard()]);

    expect(await screen.findByText("What is gravity?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /^medium$/i }));

    expect(await screen.findByText("Capital of France?")).toBeInTheDocument();
    expect(screen.queryByText("What is gravity?")).not.toBeInTheDocument();
  });
});
