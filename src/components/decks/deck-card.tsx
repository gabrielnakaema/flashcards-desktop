import { DeckWithStats } from "@/types/deck";
import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { DeckCardMasteryProgress } from "./deck-card-mastery-progress";
import { DeckCardMenu } from "./deck-card-menu";

interface DeckCardProps {
  deck: DeckWithStats;
}

export const DeckCard = ({ deck }: DeckCardProps) => {
  const renderCardsDue = () => {
    if (deck.cardsDue === 0) {
      return (
        <div className="flex items-center gap-1 bg-green-500/10 text-green-600 rounded-sm px-2 py-1 text-xs font-medium">
          <CheckCircle className="size-4" />
          Caught up!
        </div>
      );
    }

    const cardsDueText = deck.cardsDue > 1 ? "cards" : "card";

    return (
      <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 rounded-sm px-2 py-1 text-xs font-medium">
        <Clock className="size-4" />
        {deck.cardsDue} {cardsDueText} due
      </div>
    );
  };

  return (
    <article className="w-full p-4 rounded-md shadow-sm border border-border hover:shadow-md transition-shadow bg-muted flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs bg-blue-500/20 text-blue-500 rounded-md px-2 py-1 capitalize font-medium">
          {deck.category.name}
        </p>
        {renderCardsDue()}
      </div>

      <div className="flex flex-col">
        <h3 className="text-xl font-medium text-primary">{deck.title}</h3>

        <p className="text-xs text-muted-foreground">
          {deck.totalCards} {deck.totalCards !== 1 ? "cards" : "card"}
        </p>
      </div>

      <DeckCardMasteryProgress percentage={deck.masteryPercentage} />

      <div className="w-full grid grid-cols-[1fr_4rem] gap-2">
        <Button variant="default" size="lg" asChild>
          <Link
            to="/decks/$deckId/study"
            params={{ deckId: deck.id }}
            className="w-full flex items-center justify-center gap-2"
          >
            <BookOpen /> Study
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
      <div className="w-full h-5 bg-muted-foreground rounded-md" />
      <div className="w-full grid grid-cols-[1fr_4rem] gap-2">
        <div className="w-full h-9 bg-muted-foreground rounded-md" />
        <div className="w-full h-9 bg-muted-foreground rounded-md" />
      </div>
    </div>
  );
};

DeckCard.Skeleton = DeckCardSkeleton;
