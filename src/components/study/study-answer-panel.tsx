import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StudyAnswerResult } from "@/hooks/study/use-study-session";
import type { CardWithSchedule, Rating } from "@/types/card";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
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
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        wasCorrect
          ? "border-green-500/40 bg-green-500/10 text-green-200"
          : "border-red-500/40 bg-red-500/10 text-red-200"
      )}
    >
      {wasCorrect ? (
        <CheckCircle2Icon className="size-4" />
      ) : (
        <XCircleIcon className="size-4" />
      )}
      {wasCorrect ? "Correct" : "Incorrect"}
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
    <section className="flex w-full flex-col gap-3 rounded-lg border border-border bg-background/80 p-4 shadow-2xl">
      {card.type === "plain" && !isRevealed && (
        <Button type="button" size="lg" onClick={onRevealPlainAnswer}>
          Show answer
        </Button>
      )}

      {card.type === "plain" && isRevealed && (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Answer
          </p>
          <p className="whitespace-pre-wrap text-base text-foreground">
            {card.back}
          </p>
        </div>
      )}

      {card.type === "multiple_choice" && (
        <div className="grid gap-2">
          {card.content.choices.map((choice) => {
            const isSelected = answerResult?.selectedChoiceId === choice.id;
            const isCorrect = card.content.correctChoiceId === choice.id;

            return (
              <Button
                key={choice.id}
                type="button"
                variant="outline"
                disabled={isRevealed}
                onClick={() => onChoiceSelect(choice.id)}
                className={cn(
                  "h-auto justify-start whitespace-normal py-3 text-left",
                  isRevealed &&
                    isCorrect &&
                    "border-green-500/50 bg-green-500/10 text-green-100",
                  isRevealed &&
                    isSelected &&
                    !isCorrect &&
                    "border-red-500/50 bg-red-500/10 text-red-100"
                )}
              >
                <span className="mr-2 font-bold uppercase">{choice.id}.</span>
                {choice.text}
              </Button>
            );
          })}
        </div>
      )}

      {card.type === "typed_answer" && !isRevealed && (
        <form
          className="grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={handleTypedSubmit}
        >
          <Field htmlFor="study-typed-answer" containerClassName="gap-2">
            <Input
              id="study-typed-answer"
              aria-label="Your answer"
              value={typedAnswer}
              onChange={(event) => setTypedAnswer(event.target.value)}
              placeholder="Type your answer here..."
              className="h-11"
            />
          </Field>
          <Button type="submit" size="lg">
            Submit
          </Button>
        </form>
      )}

      {card.type === "typed_answer" && isRevealed && (
        <div className="grid gap-3">
          <ResultBanner wasCorrect={answerResult.wasCorrect} />
          {answerResult.response !== undefined && (
            <p className="text-sm text-muted-foreground">
              Your answer:{" "}
              <span className="text-foreground">{answerResult.response}</span>
            </p>
          )}
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Shortcut keys</p>
          <Button type="button" variant="ghost" size="sm" onClick={onDontKnow}>
            I don't know
          </Button>
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
