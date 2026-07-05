import { cn } from "@/shared/lib/utils";
import { CardWithSchedule } from "@/features/cards/types";
import { PauseIcon, PencilIcon, PlayIcon, TrashIcon } from "lucide-react";
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
  onSuspend?: () => void;
  onUnsuspend?: () => void;
}

const cardDifficultyClasses = {
  easy: "border-success/20 bg-success/10 text-success",
  medium: "border-warning/20 bg-warning/10 text-warning",
  hard: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

const cardStateClasses = {
  new: "border-info/20 bg-info/10 text-info",
  learning: "border-warning/20 bg-warning/10 text-warning",
  review: "border-success/20 bg-success/10 text-success",
  relearning: "border-primary/20 bg-primary/10 text-primary",
} as const;

export const CardListItem = ({ card, onEdit, onDelete, onSuspend, onUnsuspend }: CardListItemProps) => {
  return (
    <article className="group flex flex-col gap-3 rounded-sm border border-border bg-muted p-4 transition-colors hover:border-border/80 hover:bg-muted/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
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
              className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary"
            >
              {tag}
            </span>
          ))}
          {card.isSuspended && (
            <span className="rounded-sm border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-warning">
              Suspended
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            aria-label="Edit card"
            onClick={onEdit}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </button>
          {(onSuspend || onUnsuspend) && (
            <button
              type="button"
              aria-label={card.isSuspended ? "Unsuspend card" : "Suspend card"}
              onClick={card.isSuspended ? onUnsuspend : onSuspend}
              className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              {card.isSuspended ? (
                <PlayIcon className="size-3.5" />
              ) : (
                <PauseIcon className="size-3.5" />
              )}
            </button>
          )}
          <button
            type="button"
            aria-label="Delete card"
            onClick={onDelete}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
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
