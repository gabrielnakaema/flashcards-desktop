import { AppButton } from "@/shared/components/app-button";
import { useDeckDetails } from "@/features/decks";
import { useStudyKeyboardShortcuts } from "@/features/study/hooks/use-study-keyboard-shortcuts";
import { useStudySession } from "@/features/study/hooks/use-study-session";
import type { Rating } from "@/features/cards";
import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import "./study-motion.css";
import { StudyActionBar } from "./study-action-bar";
import { StudyAnswerPanel } from "./study-answer-panel";
import { StudyCard } from "./study-card";
import { StudyHeader } from "./study-header";
import { StudySessionSummary } from "./study-session-summary";

interface StudyScreenProps {
  deckId: string;
}

export const StudyScreen = ({ deckId }: StudyScreenProps) => {
  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useDeckDetails(deckId);
  const session = useStudySession(deckId);
  const canGoBack = useCanGoBack();
  const router = useRouter();

  const isLoading = isDeckLoading || session.isLoading;
  const error = deckError ?? session.queryError;
  const deckTitle = deck?.title ?? "Study";
  const isAnswerRevealed = session.answerResult?.isRevealed === true;

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  const handleRate = (rating: Rating) => {
    void session.rateCurrentCard(rating);
  };

  const shortcutItems = useStudyKeyboardShortcuts({
    currentCard: session.currentCard,
    isAnswerRevealed,
    isDisabled: session.isSubmitting,
    onRevealPlainAnswer: session.revealPlainAnswer,
    onChoiceSelect: session.selectChoice,
    onRate: handleRate,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon
          aria-label="Loading study session"
          role="status"
          className="size-8 animate-spin text-primary"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <section className="flex max-w-md flex-col items-center gap-4 rounded-sm border border-border bg-muted p-8 text-center">
          <h1 className="text-xl font-bold">Unable to load study session</h1>
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
          <AppButton type="button" onClick={handleBack}>
            Go back
          </AppButton>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <StudyHeader
        deckTitle={deckTitle}
        counts={session.initialCounts}
        reviewed={session.stats.reviewed}
        total={session.initialTotal}
        onBack={handleBack}
      />

      <main className="study-enter flex flex-1 flex-col items-center justify-center gap-6 overflow-auto px-4 py-8 md:px-8">
        {session.initialTotal === 0 && (
          <section className="study-enter mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-sm border border-border/60 bg-muted p-8 text-center">
            <h1 className="font-mono text-2xl font-bold tracking-tight">
              No due cards
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This deck is caught up. New or due cards will appear here when
              they are ready to review.
            </p>
            <AppButton type="button" onClick={handleBack}>
              Go back
            </AppButton>
          </section>
        )}

        {session.isComplete && (
          <StudySessionSummary stats={session.stats} onBack={handleBack} />
        )}

        {session.currentCard && (
          <div
            key={session.currentCard.id}
            className="study-enter flex w-full max-w-3xl flex-col gap-4 will-change-transform"
          >
            <StudyCard
              card={session.currentCard}
              isRevealed={isAnswerRevealed}
              wasCorrect={session.answerResult?.wasCorrect}
            />
            {session.submitError && (
              <div
                role="alert"
                className="study-enter rounded-sm border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
              >
                {session.submitError}
              </div>
            )}
            <StudyAnswerPanel
              card={session.currentCard}
              answerResult={session.answerResult}
              isSubmitting={session.isSubmitting}
              pendingRating={session.pendingRating}
              onRevealPlainAnswer={session.revealPlainAnswer}
              onTypedSubmit={session.submitTypedAnswer}
              onChoiceSelect={session.selectChoice}
              onDontKnow={session.markUnknown}
              onRate={handleRate}
            />
          </div>
        )}
      </main>

      <footer className="px-4 pb-4">
        <StudyActionBar shortcutItems={shortcutItems} />
      </footer>
    </div>
  );
};
