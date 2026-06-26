import { cn } from "@/shared/lib/utils";
import type { CardWithSchedule } from "@/features/cards";

interface StudyCardProps {
  card: CardWithSchedule;
  isRevealed: boolean;
  wasCorrect?: boolean;
}

const difficultyClasses = {
  easy: "bg-green-500/15 text-green-300",
  medium: "bg-yellow-500/15 text-yellow-300",
  hard: "bg-red-500/15 text-red-300",
} as const;

const getPrompt = (card: CardWithSchedule): string => {
  if (card.type === "multiple_choice") {
    return card.content.question ?? card.front;
  }
  if (card.type === "typed_answer") {
    return card.content.prompt ?? card.front;
  }
  return card.front;
};

const getCardKindLabel = (card: CardWithSchedule): string => {
  if (card.type === "multiple_choice") return "Multiple choice";
  if (card.type === "typed_answer") return "Typed answer";
  return "Plain";
};

export const StudyCard = ({ card, isRevealed, wasCorrect }: StudyCardProps) => {
  return (
    <article
      className={cn(
        "relative w-full overflow-hidden rounded-sm border border-border/60 bg-muted p-6 shadow-lg transition-colors duration-300 md:p-8",
        isRevealed && "study-card-revealed",
        wasCorrect === true && "border-green-500/35",
        wasCorrect === false && "border-red-500/35"
      )}
    >
      {wasCorrect !== undefined && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-6 top-0 h-px opacity-80 blur-[1px]",
            wasCorrect
              ? "bg-linear-to-r from-transparent via-green-300 to-transparent"
              : "bg-linear-to-r from-transparent via-red-300 to-transparent"
          )}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-sm border border-border/60 bg-zinc-950/60 px-2.5 py-1 text-[0.65rem] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
          {card.tags[0] ?? getCardKindLabel(card)}
        </span>
        {card.difficulty && (
          <span
            className={cn(
              "rounded-sm px-2.5 py-1 text-[0.65rem] font-mono font-semibold uppercase tracking-wide",
              difficultyClasses[card.difficulty]
            )}
          >
            {card.difficulty}
          </span>
        )}
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {getPrompt(card)}
        </h1>

        {card.hint && !isRevealed && (
          <p className="study-enter max-w-xl text-sm leading-6 text-muted-foreground">
            Hint: {card.hint}
          </p>
        )}

        {card.sourceExcerpt && (
          <blockquote className="study-enter mt-2 max-w-xl rounded-sm border border-border/60 bg-zinc-950/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {card.sourceExcerpt}
          </blockquote>
        )}

        {isRevealed && card.explanation && (
          <div className="study-enter mt-3 w-full rounded-sm border border-border/60 bg-zinc-950/40 p-4 text-left">
            <p className="mb-1 text-[10px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
              Explanation
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {card.explanation}
            </p>
          </div>
        )}
      </div>
    </article>
  );
};
