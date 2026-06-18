import { cn } from "@/lib/utils";
import { Card } from "@/types/card";
import { Button } from "../ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";

interface CardListItemProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

const cardDifficultyClasses = {
  easy: "bg-green-500/10 text-green-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  hard: "bg-red-500/10 text-red-600",
} as const;

const cardDifficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
} as const;

const correctChoiceClasses = "text-green-600 font-medium";

export const CardListItem = ({ card, onEdit, onDelete }: CardListItemProps) => {
  return (
    <article
      key={card.id}
      className="p-4 pt-3 rounded-sm border border-border shadow-lg flex flex-col gap-1"
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

          {card.tags.map((tag) => (
            <div
              key={tag}
              className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600"
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
    </article>
  );
};
