import {
  getChoiceText,
  gradeTypedAnswer,
  isCorrectChoice,
} from "@/features/study/components/study-grading";
import type {
  CardState,
  CardWithSchedule,
  Rating,
  ReviewLog,
} from "@/features/cards";
import { useEffect, useMemo, useState } from "react";
import { useDueCards } from "./use-due-cards";
import { useSubmitReview } from "./use-submit-review";
import {
  countDueCards,
  getUpdatedStats,
  getSoonestDueAt,
  type StudyAnswerResult,
  type StudyQueueCounts,
  type StudySessionStats,
} from "./use-study-session.utils";

export type {
  StudyAnswerResult,
  StudyQueueCounts,
  StudySessionStats,
} from "./use-study-session.utils";

const emptyCounts = { new: 0, learning: 0, review: 0 };

export const useStudySession = (deckId: string) => {
  const dueCardsQuery = useDueCards(deckId);
  const { submitReview, isPending, error } = useSubmitReview(deckId);
  const [initializedDeckId, setInitializedDeckId] = useState<string | null>(
    null
  );
  const [queue, setQueue] = useState<CardWithSchedule[]>([]);
  const [initialCounts, setInitialCounts] =
    useState<StudyQueueCounts>(emptyCounts);
  const [initialTotal, setInitialTotal] = useState(0);
  const [answerResult, setAnswerResult] = useState<StudyAnswerResult | null>(
    null
  );
  const [stats, setStats] = useState<StudySessionStats>({
    reviewed: 0,
    correct: 0,
    again: 0,
    nextDueAt: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingRating, setPendingRating] = useState<Rating | null>(null);
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now());

  useEffect(() => {
    if (
      initializedDeckId === deckId ||
      !dueCardsQuery.data ||
      dueCardsQuery.isFetching
    ) {
      return;
    }

    setQueue(dueCardsQuery.data);
    setInitialCounts(countDueCards(dueCardsQuery.data));
    setInitialTotal(dueCardsQuery.data.length);
    setStats({ reviewed: 0, correct: 0, again: 0, nextDueAt: null });
    setAnswerResult(null);
    setSubmitError(null);
    setPendingRating(null);
    setCardStartedAt(Date.now());
    setInitializedDeckId(deckId);
  }, [deckId, dueCardsQuery.data, dueCardsQuery.isFetching, initializedDeckId]);

  const currentCard = queue[0] ?? null;
  const remainingCounts = useMemo(() => countDueCards(queue), [queue]);

  const revealPlainAnswer = () => {
    setSubmitError(null);
    setPendingRating(null);
    setAnswerResult({ isRevealed: true });
  };

  const markUnknown = () => {
    setSubmitError(null);
    setPendingRating(null);
    setAnswerResult({ isRevealed: true, wasCorrect: false });
  };

  const submitTypedAnswer = (response: string) => {
    if (!currentCard || currentCard.type !== "typed_answer") return;

    const grade = gradeTypedAnswer(currentCard, response);
    setSubmitError(null);
    setPendingRating(null);
    setAnswerResult({
      isRevealed: true,
      response,
      wasCorrect: grade.isCorrect,
    });
  };

  const selectChoice = (choiceId: string) => {
    if (!currentCard || currentCard.type !== "multiple_choice") return;

    setSubmitError(null);
    setPendingRating(null);
    setAnswerResult({
      isRevealed: true,
      response: getChoiceText(currentCard, choiceId) ?? choiceId,
      selectedChoiceId: choiceId,
      wasCorrect: isCorrectChoice(currentCard, choiceId),
    });
  };

  const rateCurrentCard = async (rating: Rating): Promise<ReviewLog | null> => {
    if (!currentCard || !answerResult?.isRevealed || pendingRating) {
      return null;
    }

    const reviewedCard = currentCard;
    const reviewedAnswer = answerResult;
    const elapsedMs = Date.now() - cardStartedAt;
    setPendingRating(rating);
    setSubmitError(null);
    setQueue((cards) =>
      cards[0]?.id === reviewedCard.id ? cards.slice(1) : cards
    );
    setAnswerResult(null);
    const statsSnapshot = stats;
    setStats((currentStats) =>
      getUpdatedStats(currentStats, rating, reviewedAnswer, null)
    );
    setCardStartedAt(Date.now());

    try {
      const reviewLog = await submitReview({
        cardId: reviewedCard.id,
        deckId,
        rating,
        response: reviewedAnswer.response,
        wasCorrect: reviewedAnswer.wasCorrect,
        elapsedMs,
      });

      setStats((currentStats) => ({
        ...currentStats,
        nextDueAt: getSoonestDueAt(currentStats.nextDueAt, reviewLog.nextDueAt),
      }));
      setSubmitError(null);
      setPendingRating(null);
      return reviewLog;
    } catch (err) {
      setQueue((cards) =>
        cards.some((card) => card.id === reviewedCard.id)
          ? cards
          : [reviewedCard, ...cards]
      );
      setStats(statsSnapshot);
      setAnswerResult(reviewedAnswer);
      setSubmitError((err as Error).message);
      setPendingRating(null);
      return null;
    }
  };

  const skipCurrentCard = () => {
    if (!currentCard) return;
    setQueue((cards) =>
      cards[0]?.id === currentCard.id ? cards.slice(1) : cards
    );
    setAnswerResult(null);
    setCardStartedAt(Date.now());
  };

  const restartSession = async () => {
    setInitializedDeckId(null);
    setQueue([]);
    setAnswerResult(null);
    setSubmitError(null);
    setPendingRating(null);
    setStats({ reviewed: 0, correct: 0, again: 0, nextDueAt: null });
    setCardStartedAt(Date.now());
    await dueCardsQuery.refetch();
  };

  return {
    currentCard,
    answerResult,
    queue,
    initialCounts,
    initialTotal,
    remainingCounts,
    stats,
    isInitialized: initializedDeckId === deckId,
    isLoading:
      initializedDeckId !== deckId &&
      (dueCardsQuery.isPending || dueCardsQuery.isFetching),
    isFetching: dueCardsQuery.isFetching,
    isSubmitting: isPending || pendingRating !== null,
    pendingRating,
    queryError: dueCardsQuery.error,
    submitError: submitError ?? error?.message ?? null,
    isComplete:
      initializedDeckId === deckId && initialTotal > 0 && !currentCard,
    revealPlainAnswer,
    markUnknown,
    submitTypedAnswer,
    selectChoice,
    rateCurrentCard,
    skipCurrentCard,
    restartSession,
  };
};

export type StudyCardState = CardState;
