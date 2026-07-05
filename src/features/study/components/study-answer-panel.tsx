import { AppButton } from "@/shared/components/app-button";
import { AppInput } from "@/shared/components/app-input";
import { cn } from "@/shared/lib/utils";
import type { StudyAnswerResult } from "@/features/study/hooks/use-study-session";
import type { CardWithSchedule, Rating } from "@/features/cards";
import { CheckCircle2Icon, SparklesIcon, XCircleIcon } from "lucide-react";
import { FormEvent, type CSSProperties, useEffect, useState } from "react";
import { StudyRatingPanel } from "./study-rating-panel";

interface StudyAnswerPanelProps {
  card: CardWithSchedule;
  answerResult: StudyAnswerResult | null;
  isSubmitting: boolean;
  pendingRating: Rating | null;
  onRevealPlainAnswer: () => void;
  onTypedSubmit: (response: string) => void;
  onChoiceSelect: (choiceId: string) => void;
  onDontKnow: () => void;
  onRate: (rating: Rating) => void;
}

const ResultBanner = ({ wasCorrect }: { wasCorrect?: boolean }) => {
  if (wasCorrect === undefined) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-sm border px-3 py-2.5 text-sm font-medium",
        wasCorrect
          ? "study-correct-pop border-success/40 bg-success/10 text-success"
          : "study-incorrect-shake border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      {wasCorrect ? (
        <CheckCircle2Icon className="size-4" />
      ) : (
        <XCircleIcon className="size-4" />
      )}
      <span>{wasCorrect ? "Correct" : "Incorrect"}</span>
      {wasCorrect && <SparklesIcon className="ml-auto size-4 opacity-70" />}
    </div>
  );
};

export const StudyAnswerPanel = ({
  card,
  answerResult,
  isSubmitting,
  pendingRating,
  onRevealPlainAnswer,
  onTypedSubmit,
  onChoiceSelect,
  onDontKnow,
  onRate,
}: StudyAnswerPanelProps) => {
  const [typedAnswer, setTypedAnswer] = useState("");
  const isRevealed = answerResult?.isRevealed === true;

  useEffect(() => {
    setTypedAnswer("");
  }, [card.id]);

  const handleTypedSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onTypedSubmit(typedAnswer);
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-sm border border-border/60 bg-muted p-4 shadow-lg">
      {card.type === "plain" && !isRevealed && (
        <AppButton
          type="button"
          size="lg"
          aria-keyshortcuts="Space"
          onClick={onRevealPlainAnswer}
          className="transition-transform duration-200 hover:-translate-y-0.5"
        >
          Show answer
        </AppButton>
      )}

      {card.type === "plain" && isRevealed && (
        <div className="study-enter rounded-sm border border-border/60 bg-background/60 p-4">
          <p className="mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
            Answer
          </p>
          <p className="whitespace-pre-wrap text-base text-foreground">
            {card.back}
          </p>
        </div>
      )}

      {card.type === "multiple_choice" && (
        <div className="grid gap-2">
          {card.content.choices.map((choice, index) => {
            const isSelected = answerResult?.selectedChoiceId === choice.id;
            const isCorrect = card.content.correctChoiceId === choice.id;

            return (
              <AppButton
                key={choice.id}
                type="button"
                variant="secondary"
                aria-keyshortcuts={
                  choice.id.trim().length === 1 ? choice.id.trim() : undefined
                }
                disabled={isRevealed}
                onClick={() => onChoiceSelect(choice.id)}
                style={{ "--study-stagger": index } as CSSProperties}
                className={cn(
                  "h-auto justify-start whitespace-normal py-3 text-left transition duration-200 hover:-translate-y-0.5",
                  !isRevealed && "study-enter",
                  isRevealed &&
                    isCorrect &&
                    "study-correct-pop border-success/60 text-success disabled:opacity-100",
                  isRevealed &&
                    isSelected &&
                    !isCorrect &&
                    "study-incorrect-shake border-destructive/40 bg-destructive/10 text-destructive"
                )}
              >
                <span className="mr-2 font-mono font-bold uppercase">
                  {choice.id}.
                </span>
                <span className="flex-1">{choice.text}</span>
                {isRevealed && isCorrect && (
                  <CheckCircle2Icon className="ml-auto size-4 text-success" />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <XCircleIcon className="ml-auto size-4 text-destructive" />
                )}
              </AppButton>
            );
          })}
        </div>
      )}

      {card.type === "typed_answer" && !isRevealed && (
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={handleTypedSubmit}
        >
          <AppInput
            id="study-typed-answer"
            aria-label="Your answer"
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Type your answer here..."
            className="flex-1"
          />
          <AppButton type="submit" size="lg">
            Submit
          </AppButton>
        </form>
      )}

      {card.type === "typed_answer" && isRevealed && (
        <div className="study-enter flex flex-col gap-3">
          <ResultBanner wasCorrect={answerResult.wasCorrect} />
          {answerResult.response !== undefined && (
            <p className="text-sm text-muted-foreground">
              Your answer:{" "}
              <span className="text-foreground">{answerResult.response}</span>
            </p>
          )}
          <div className="rounded-sm border border-border/60 bg-background/60 p-4">
            <p className="mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
              Accepted answer
            </p>
            <p className="text-base text-foreground">
              {card.content.acceptedAnswer}
            </p>
          </div>
        </div>
      )}

      {card.type === "multiple_choice" && isRevealed && (
        <ResultBanner wasCorrect={answerResult.wasCorrect} />
      )}

      {!isRevealed && (
        <div className="study-enter flex items-center justify-end">
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDontKnow}
          >
            I don't know
          </AppButton>
        </div>
      )}

      {isRevealed && (
        <StudyRatingPanel
          isSubmitting={isSubmitting}
          pendingRating={pendingRating}
          onRate={onRate}
        />
      )}
    </section>
  );
};
