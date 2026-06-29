import { cn } from "@/shared/lib/utils";
import { CardWithSchedule } from "@/features/cards/types";
import { PencilIcon, TrashIcon } from "lucide-react";
import { CardListItemAnswer } from "./card-list-item-answer";
import {
  cardDifficultyLabels,
  cardStateLabels,
  cardTypeLabels,
  formatScheduleSummary,
} from "./card-list-item.utils";

interface CardListItemProps {
  card: CardWithSchedule;
  onEdit: () => void;
  onDelete: () => void;
}

const cardDifficultyClasses = {
  easy: "border-green-500/20 bg-green-500/10 text-green-500",
  medium: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
  hard: "border-red-500/20 bg-red-500/10 text-red-500",
} as const;

const cardStateClasses = {
  new: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  learning: "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
  review: "border-green-500/20 bg-green-500/10 text-green-500",
  relearning: "border-orange-500/20 bg-orange-500/10 text-orange-400",
} as const;

export const CardListItem = ({ card, onEdit, onDelete }: CardListItemProps) => {
  return (
    <article className="group flex flex-col gap-3 rounded-sm border border-border bg-muted p-4 transition-colors hover:border-border/80 hover:bg-muted/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-sm border border-border bg-zinc-950 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {cardTypeLabels[card.type]}
          </span>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
              cardStateClasses[card.schedule.state]
            )}
          >
            {cardStateLabels[card.schedule.state]}
          </span>
          {card.difficulty && (
            <span
              className={cn(
                "rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                cardDifficultyClasses[card.difficulty]
              )}
            >
              {cardDifficultyLabels[card.difficulty]}
            </span>
          )}
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-orange-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            aria-label="Edit card"
            onClick={onEdit}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-zinc-950 hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete card"
            onClick={onDelete}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-zinc-950 hover:text-red-500"
          >
            <TrashIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
          {card.front}
        </p>
        <CardListItemAnswer card={card} />
      </div>

      <div className="border-t border-border/60 pt-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>{formatScheduleSummary(card.schedule)}</span>
      </div>
    </article>
  );
};
