import { cn } from "@/shared/lib/utils";
import { CardWithSchedule } from "@/features/cards/types";
import { CheckIcon } from "lucide-react";

interface CardListItemAnswerProps {
  card: CardWithSchedule;
}

export const CardListItemAnswer = ({ card }: CardListItemAnswerProps) => {
  if (card.type === "plain") {
    if (!card.back) return null;

    return (
      <p className="line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
        {card.back}
      </p>
    );
  }

  if (card.type === "multiple_choice") {
    return (
      <ul className="flex flex-col gap-1.5" aria-label="Answer choices">
        {card.content.choices.map((choice) => {
          const isCorrect = choice.id === card.content.correctChoiceId;

          return (
            <li
              key={choice.id}
              className={cn(
                "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-sm",
                isCorrect
                  ? "border-green-500/25 bg-green-500/10 text-green-500"
                  : "border-border/60 bg-zinc-950/60 text-muted-foreground"
              )}
            >
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider">
                {choice.id}.
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap">
                {choice.text}
              </span>
              {isCorrect && (
                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
                  <CheckIcon className="size-3" aria-hidden="true" />
                  Correct
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  if (card.type === "typed_answer") {
    const aliases = card.content.aliases ?? [];

    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-sm border border-green-500/25 bg-green-500/10 px-2.5 py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-green-500/80">
            Accepted answer
          </p>
          <p className="mt-0.5 text-sm text-green-500 whitespace-pre-wrap">
            {card.content.acceptedAnswer}
          </p>
        </div>

        {aliases.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Aliases
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aliases.map((alias) => (
                <span
                  key={alias}
                  className="rounded-sm border border-border bg-zinc-950 px-2 py-0.5 text-xs text-foreground"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
