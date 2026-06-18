import { cn } from "@/lib/utils";
import { CardWithSchedule } from "@/types/card";
import { Button } from "../ui/button";
import { CalendarClockIcon, PencilIcon, TrashIcon } from "lucide-react";

interface CardListItemProps {
  card: CardWithSchedule;
  onEdit: () => void;
  onDelete: () => void;
}

const cardDifficultyClasses = {
  easy: "bg-green-500/10 text-green-600 border border-green-600/20",
  medium: "bg-yellow-500/10 text-yellow-600 border border-yellow-600/20",
  hard: "bg-red-500/10 text-red-600 border border-red-600/20",
} as const;

const cardDifficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

const correctChoiceClasses = "text-green-600 font-medium";

const cardStateLabels = {
  new: "New",
  learning: "Learning",
  review: "Review",
  relearning: "Relearning",
} as const;

const cardStateClasses = {
  new: "bg-blue-500/10 text-blue-600 border border-blue-600/20",
  learning: "bg-yellow-500/10 text-yellow-600 border border-yellow-600/20",
  review: "bg-green-500/10 text-green-600 border border-green-600/20",
  relearning: "bg-orange-500/10 text-orange-600 border border-orange-600/20",
} as const;

const formatDateTime = (value: string | null): string => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatInterval = (days: number): string => {
  if (days === 0) return "Same day";
  if (days === 1) return "1 day";
  return `${days} days`;
};

export const CardListItem = ({ card, onEdit, onDelete }: CardListItemProps) => {
  const { schedule } = card;

  return (
    <article
      key={card.id}
      className="p-4 pt-3 rounded-sm border border-border shadow-lg flex flex-col gap-3"
    >
      <div className="w-full flex items-start justify-between">
        <div className="flex items-center gap-2 ">
          {card.difficulty && (
            <div
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium",
                cardDifficultyClasses[card.difficulty]
              )}
            >
              {cardDifficultyLabels[card.difficulty]}
            </div>
          )}
          <div className="w-px h-4 bg-border min-w-px" />
          {card.tags.map((tag) => (
            <div
              key={tag}
              className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-600/20"
            >
              {tag}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit card"
            onClick={onEdit}
            type="button"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete card"
            onClick={onDelete}
            type="button"
          >
            <TrashIcon className="size-4 text-red-500" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2">
        <div className="flex flex-col gap-1 w-full border-r border-border pr-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Front
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {card.front}
          </p>
        </div>
        {card.type === "plain" && (
          <div className="flex flex-col gap-1 pl-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Back
            </p>
            <p className="text-sm text-foreground">{card.back}</p>
          </div>
        )}

        {card.type === "multiple_choice" && (
          <div className="flex flex-col gap-1 pl-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Choices
            </p>

            {card.content.choices.map((choice) => {
              const isCorrect = choice.id === card.content.correctChoiceId;

              return (
                <div key={choice.id} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-sm text-muted-foreground w-3",
                      isCorrect && correctChoiceClasses
                    )}
                  >
                    {choice.id}.
                  </span>
                  <p
                    className={cn(
                      "text-sm text-foreground",
                      isCorrect && correctChoiceClasses
                    )}
                  >
                    {choice.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {card.type === "typed_answer" && (
          <div className="flex flex-col gap-1 pl-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Accepted answer
            </p>
            <p className="text-sm text-foreground">
              {card.content.acceptedAnswer}
            </p>
            {!!card.content?.aliases?.length && (
              <p className="text-xs text-muted-foreground">
                Aliases: {card.content.aliases?.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <CalendarClockIcon className="size-4 text-muted-foreground" />
          <span>Due {formatDateTime(schedule.dueAt)}</span>
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 font-medium",
            cardStateClasses[schedule.state]
          )}
        >
          {cardStateLabels[schedule.state]}
        </span>
        <span>Interval: {formatInterval(schedule.intervalDays)}</span>
        <span>Last reviewed: {formatDateTime(schedule.lastReviewedAt)}</span>
      </div>
    </article>
  );
};
