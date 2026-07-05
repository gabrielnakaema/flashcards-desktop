import { DeckWithStats } from "@/features/decks/types";
import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { DeckCardMasteryProgress } from "./deck-card-mastery-progress";
import { DeckCardMenu } from "./deck-card-menu";

interface DeckCardProps {
  deck: DeckWithStats;
  deckColorClassName: string;
}

export const DeckCard = ({ deck, deckColorClassName }: DeckCardProps) => {
  return (
    <article className="w-full p-4 rounded-md hover:shadow-md transition-shadow flex flex-col gap-3 bg-muted border border-border">
      <div className="w-full flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {deck.title}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 min-w-0">
            <span className="whitespace-nowrap">
              {deck.totalCards} {deck.totalCards !== 1 ? "cards" : "card"}
            </span>
            <span>&bull;</span>
            <span className="truncate">{deck.category.name}</span>
          </p>
        </div>
        {deck.cardsDue > 0 && (
          <div className="flex items-center gap-1 bg-warning/10 text-warning rounded-xs px-2 py-0.5 text-[10px] font-medium whitespace-nowrap shrink-0">
            {deck.cardsDue} due
          </div>
        )}
      </div>

      <DeckCardMasteryProgress
        percentage={deck.masteryPercentage}
        lastReviewedAt={deck.lastReviewedAt}
        backgroundColor={deckColorClassName}
      />

      <div className="w-full grid grid-cols-[1fr_4rem] gap-2">
        <Button
          variant="default"
          size="sm"
          asChild
          className="rounded-sm bg-primary w-full hover:bg-primary/80 focus:bg-primary/80"
        >
          <Link to="/decks/$deckId/study" params={{ deckId: deck.id }}>
            Study
          </Link>
        </Button>
        <DeckCardMenu deck={deck} />
      </div>
    </article>
  );
};

const DeckCardSkeleton = () => {
  return (
    <div className="w-full p-4 rounded-md shadow-sm border border-border hover:shadow-md transition-shadow bg-muted flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-16 h-3 bg-muted-foreground rounded-md" />
        <div className="w-16 h-3 bg-muted-foreground rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="w-3/4 h-4 bg-muted-foreground rounded-md" />
        <div className="w-1/4 h-2 bg-muted-foreground rounded-md" />
      </div>
      <div className="w-full h-2 bg-muted-foreground rounded-md" />
      <div className="w-full grid grid-cols-[1fr_4rem] gap-2">
        <div className="w-full h-6 bg-muted-foreground rounded-md" />
        <div className="w-full h-6 bg-muted-foreground rounded-md" />
      </div>
    </div>
  );
};

DeckCard.Skeleton = DeckCardSkeleton;
