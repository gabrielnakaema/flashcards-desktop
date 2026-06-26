import { cn } from "@/shared/lib/utils";
import type { DeckWithStats } from "@/features/decks";
import { getDeckColor } from "@/shared/utils/deck-colors";
import { Link } from "@tanstack/react-router";

interface SidebarDeckListProps {
  decks: DeckWithStats[];
  isFetching: boolean;
  pathname: string;
  onNavigate?: () => void;
}

export const SidebarDeckList = ({
  decks,
  isFetching,
  pathname,
  onNavigate,
}: SidebarDeckListProps) => {
  if (isFetching) {
    return <SidebarDeckListSkeleton />;
  }

  if (decks.length === 0) {
    return <p className="px-3 text-sm text-zinc-600">No decks yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {decks.map((deck, index) => (
        <SidebarDeckLink
          key={deck.id}
          deck={deck}
          colorClassName={getDeckColor(index)}
          isActive={pathname === `/decks/${deck.id}/cards`}
          onNavigate={onNavigate}
        />
      ))}
    </ul>
  );
};

const SidebarDeckListSkeleton = () => (
  <div
    role="status"
    aria-label="Loading decks"
    className="flex flex-col gap-3 px-3"
  >
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-5 animate-pulse rounded-sm bg-white/10" />
    ))}
  </div>
);

interface SidebarDeckLinkProps {
  deck: DeckWithStats;
  colorClassName: string;
  isActive: boolean;
  onNavigate?: () => void;
}

const SidebarDeckLink = ({
  deck,
  colorClassName,
  isActive,
  onNavigate,
}: SidebarDeckLinkProps) => (
  <li>
    <Link
      to="/decks/$deckId/cards"
      params={{ deckId: deck.id }}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-sm px-2 py-1 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100",
        isActive && "bg-white/10 text-white"
      )}
    >
      <span
        className={cn(
          "h-1.5 min-h-1.5 w-1.5 min-w-1.5 rounded-[1px]",
          colorClassName
        )}
      />
      <span className="min-w-0 flex-1 truncate text-xs font-normal">
        {deck.title}
      </span>
      {deck.cardsDue > 0 && (
        <span className="text-xs font-medium text-orange-400">
          {deck.cardsDue}
        </span>
      )}
    </Link>
  </li>
);
