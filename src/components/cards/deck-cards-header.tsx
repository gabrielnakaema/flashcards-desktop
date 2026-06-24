import { Link } from "@tanstack/react-router";
import { ChevronLeft, PencilIcon, PlusIcon, Sparkles } from "lucide-react";

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
            <span className="rounded-sm border border-border bg-zinc-900 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
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
          <Link
            to="/decks/$deckId/study"
            params={{ deckId }}
            className="inline-flex items-center justify-center rounded-sm border border-orange-400 bg-orange-400 px-4 py-2 text-sm font-medium tracking-tight text-zinc-950 transition-colors hover:border-orange-500 hover:bg-orange-500 font-mono"
          >
            Study
          </Link>
          <Link
            to="/decks/$deckId/edit"
            params={{ deckId }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-zinc-950 px-4 py-2 text-sm font-medium tracking-tight text-muted-foreground transition-colors hover:bg-zinc-900 hover:text-foreground font-mono"
          >
            <PencilIcon className="size-3.5" />
            Edit deck
          </Link>
          <Link
            to="/decks/$deckId/generate"
            params={{ deckId }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-zinc-950 px-4 py-2 text-sm font-medium tracking-tight text-foreground transition-colors hover:bg-zinc-900 font-mono"
          >
            <Sparkles className="size-3.5" />
            Generate
          </Link>
          {onCreateCard && (
            <button
              type="button"
              onClick={onCreateCard}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-zinc-950 px-4 py-2 text-sm font-medium tracking-tight text-foreground transition-colors hover:bg-zinc-900 font-mono"
            >
              <PlusIcon className="size-3.5" />
              New card
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
