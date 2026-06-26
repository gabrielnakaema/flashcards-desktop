import { Link } from "@tanstack/react-router";
import { ChevronLeft, PencilIcon, PlusIcon, Sparkles } from "lucide-react";
import { AppButton } from "@/shared/components/app-button";

interface DeckCardsHeaderProps {
  deckId: string;
  deckTitle: string;
  categoryName: string;
  deckTags?: string[];
  onCreateCard?: () => void;
}

export const DeckCardsHeader = ({
  deckId,
  deckTitle,
  categoryName,
  deckTags = [],
  onCreateCard,
}: DeckCardsHeaderProps) => {
  return (
    <header className="flex w-full flex-col gap-4">
      <Link
        to="/"
        className="flex w-fit items-center gap-1 py-2 text-xs font-mono tracking-tight text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        back to decks
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {deckTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-sm border border-border bg-muted px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {categoryName}
            </span>
            {deckTags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-orange-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppButton asChild>
            <Link to="/decks/$deckId/study" params={{ deckId }}>
              Study
            </Link>
          </AppButton>
          <AppButton variant="secondary" asChild>
            <Link to="/decks/$deckId/edit" params={{ deckId }}>
              <PencilIcon className="size-3.5" />
              Edit deck
            </Link>
          </AppButton>
          <AppButton variant="secondary" asChild className="text-foreground">
            <Link to="/decks/$deckId/generate" params={{ deckId }}>
              <Sparkles className="size-3.5" />
              Generate
            </Link>
          </AppButton>
          {onCreateCard && (
            <AppButton
              type="button"
              variant="secondary"
              className="text-foreground"
              onClick={onCreateCard}
            >
              <PlusIcon className="size-3.5" />
              New card
            </AppButton>
          )}
        </div>
      </div>
    </header>
  );
};
