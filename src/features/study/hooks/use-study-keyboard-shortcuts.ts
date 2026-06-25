import type { CardWithSchedule, Rating } from "@/features/cards";
import { useEffect, useEffectEvent } from "react";

export interface StudyShortcutItem {
  keys: string[];
  label: string;
}

interface UseStudyKeyboardShortcutsOptions {
  currentCard: CardWithSchedule | null;
  isAnswerRevealed: boolean;
  isDisabled: boolean;
  onRevealPlainAnswer: () => void;
  onChoiceSelect: (choiceId: string) => void;
  onRate: (rating: Rating) => void;
}

const ratingShortcuts: Record<string, Rating> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};

const ratingShortcutItems: StudyShortcutItem[] = [
  { keys: ["1"], label: "Again" },
  { keys: ["2"], label: "Hard" },
  { keys: ["3"], label: "Medium" },
  { keys: ["4"], label: "Easy" },
];

const isEditableShortcutTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
};

const isSpaceKey = (event: KeyboardEvent): boolean =>
  event.key === " " || event.code === "Space";

const getSingleLetterChoiceId = (choiceId: string): string | null => {
  const shortcut = choiceId.trim();
  return shortcut.length === 1 ? shortcut : null;
};

const getStudyShortcutItems = (
  card: CardWithSchedule | null,
  isRevealed: boolean
): StudyShortcutItem[] => {
  if (!card) return [];
  if (isRevealed) return ratingShortcutItems;

  if (card.type === "plain") {
    return [{ keys: ["Space"], label: "Show answer" }];
  }

  if (card.type === "multiple_choice") {
    return card.content.choices.flatMap((choice) => {
      const shortcut = getSingleLetterChoiceId(choice.id);
      return shortcut
        ? [{ keys: [shortcut.toLocaleUpperCase()], label: choice.text }]
        : [];
    });
  }

  return [];
};

export const useStudyKeyboardShortcuts = ({
  currentCard,
  isAnswerRevealed,
  isDisabled,
  onRevealPlainAnswer,
  onChoiceSelect,
  onRate,
}: UseStudyKeyboardShortcutsOptions): StudyShortcutItem[] => {
  const handleKeyDown = useEffectEvent(
    (event: KeyboardEvent, card: CardWithSchedule) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableShortcutTarget(event.target) ||
        isDisabled
      ) {
        return;
      }

      if (isAnswerRevealed) {
        const rating = ratingShortcuts[event.key];
        if (!rating) return;

        event.preventDefault();
        onRate(rating);
        return;
      }

      if (card.type === "plain" && isSpaceKey(event)) {
        event.preventDefault();
        onRevealPlainAnswer();
        return;
      }

      if (card.type === "multiple_choice") {
        const matchingChoice = card.content.choices.find((choice) => {
          const shortcut = getSingleLetterChoiceId(choice.id);
          return (
            shortcut !== null &&
            shortcut.toLocaleLowerCase() === event.key.toLocaleLowerCase()
          );
        });

        if (matchingChoice) {
          event.preventDefault();
          onChoiceSelect(matchingChoice.id);
        }
      }
    }
  );

  useEffect(() => {
    if (!currentCard) return;

    const keydown = (event: KeyboardEvent) => {
      handleKeyDown(event, currentCard);
    };

    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [currentCard]);

  return getStudyShortcutItems(currentCard, isAnswerRevealed);
};
