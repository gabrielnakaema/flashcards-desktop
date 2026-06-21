import { Button } from "@/components/ui/button";
import { useDeckDetails } from "@/hooks/decks/use-deck-details";
import { useStudySession } from "@/hooks/study/use-study-session";
import { cn } from "@/lib/utils";
import type { Rating } from "@/types/card";
import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./study-motion.css";
import { StudyActionBar } from "./study-action-bar";
import { StudyAnswerPanel } from "./study-answer-panel";
import { StudyCard } from "./study-card";
import { StudyHeader } from "./study-header";
import { StudySessionSummary } from "./study-session-summary";

interface StudyScreenProps {
  deckId: string;
}

const RATING_EXIT_MS = 240;

export const StudyScreen = ({ deckId }: StudyScreenProps) => {
  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useDeckDetails(deckId);
  const session = useStudySession(deckId);
  const canGoBack = useCanGoBack();
  const router = useRouter();
  const [exitingRating, setExitingRating] = useState<Rating | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const isLoading = isDeckLoading || session.isLoading;
  const error = deckError ?? session.queryError;
  const deckTitle = deck?.title ?? "Study";
  const isRatingTransitioning = exitingRating !== null;

  useEffect(() => {
    setExitingRating(null);

    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [deckId, session.currentCard?.id]);

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  const handleRate = (rating: Rating) => {
    if (isRatingTransitioning) return;

    setExitingRating(rating);
    exitTimerRef.current = window.setTimeout(() => {
      void session.rateCurrentCard(rating).finally(() => {
        setExitingRating(null);
        exitTimerRef.current = null;
      });
    }, RATING_EXIT_MS);
  };

  if (isLoading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2Icon
          aria-label="Loading study session"
          role="status"
          className="size-10 animate-spin text-primary"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <section className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Unable to load study session</h1>
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
          <Button type="button" onClick={handleBack}>
            Go back
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      <StudyHeader
        deckTitle={deckTitle}
        counts={session.initialCounts}
        reviewed={session.stats.reviewed}
        total={session.initialTotal}
        onBack={handleBack}
      />

      <main className="study-enter flex flex-1 flex-col items-center justify-center gap-8 overflow-auto px-4 py-8 md:px-8">
        {session.initialTotal === 0 && (
          <section className="study-enter mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">No due cards</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              This deck is caught up. New or due cards will appear here when
              they are ready to review.
            </p>
            <Button type="button" onClick={handleBack}>
              Go back
            </Button>
          </section>
        )}

        {session.isComplete && (
          <StudySessionSummary stats={session.stats} onBack={handleBack} />
        )}

        {session.currentCard && (
          <div
            key={session.currentCard.id}
            className={cn(
              "study-enter flex w-full max-w-3xl flex-col gap-6 will-change-transform",
              exitingRating && "study-card-exit"
            )}
          >
            <StudyCard
              card={session.currentCard}
              isRevealed={session.answerResult?.isRevealed === true}
              wasCorrect={session.answerResult?.wasCorrect}
            />
            {session.submitError && (
              <div
                role="alert"
                className="study-enter rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
              >
                {session.submitError}
              </div>
            )}
            <StudyAnswerPanel
              card={session.currentCard}
              answerResult={session.answerResult}
              isSubmitting={session.isSubmitting || isRatingTransitioning}
              pendingRating={exitingRating ?? session.pendingRating}
              onRevealPlainAnswer={session.revealPlainAnswer}
              onTypedSubmit={session.submitTypedAnswer}
              onChoiceSelect={session.selectChoice}
              onDontKnow={session.markUnknown}
              onRate={handleRate}
            />
          </div>
        )}
      </main>

      <footer className="px-4 pb-6">
        <StudyActionBar />
      </footer>
    </div>
  );
};
