import { cn } from "@/lib/utils";
import type { CardWithSchedule } from "@/types/card";

interface StudyCardProps {
  card: CardWithSchedule;
  isRevealed: boolean;
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

export const StudyCard = ({ card, isRevealed }: StudyCardProps) => {
  return (
    <article className="w-full rounded-lg border border-border/70 bg-card p-5 shadow-2xl md:p-8">
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {card.tags[0] ?? getCardKindLabel(card)}
        </span>
        {card.difficulty && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide",
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
          <p className="max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            Hint: {card.hint}
          </p>
        )}

        {card.sourceExcerpt && (
          <blockquote className="mt-2 max-w-xl rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {card.sourceExcerpt}
          </blockquote>
        )}

        {isRevealed && card.explanation && (
          <div className="mt-3 w-full rounded-lg border border-border bg-muted/50 p-4 text-left">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
