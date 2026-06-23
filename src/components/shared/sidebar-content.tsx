import { useListDecks } from "@/hooks/decks/use-list-decks";
import { Link, useRouterState } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { SidebarDeckList } from "./sidebar-deck-list";
import { SidebarNav } from "./sidebar-nav";

interface SidebarContentProps {
  onNavigate?: () => void;
}

export const SidebarContent = ({ onNavigate }: SidebarContentProps) => {
  const { data: decks = [], isFetching } = useListDecks();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const reviewCardsDue = decks.reduce(
    (total, deck) => total + deck.cardsDue,
    0
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="border-b border-white/10 px-6 py-7">
        <Link
          to="/"
          onClick={onNavigate}
          className="text-3xl font-bold tracking-tight text-white"
        >
          Flashcards<span className="text-orange-400">.</span>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-6 px-3 py-5">
        <SidebarNav
          decks={decks}
          pathname={pathname}
          reviewCardsDue={reviewCardsDue}
          onNavigate={onNavigate}
        />

        <div className="min-h-0 border-t border-white/10 pt-6">
          <p className="px-3 text-xs font-medium uppercase tracking-[0.125em] text-zinc-600">
            Decks
          </p>
          <div className="mt-4 max-h-[calc(100vh-28rem)] min-h-0 overflow-y-auto pr-1">
            <SidebarDeckList
              decks={decks}
              isFetching={isFetching}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-lg font-bold text-white">
            <Flame className="size-4 text-orange-400" />
            <span className="text-sm font-medium">12-day streak</span>
          </div>
          <p className="text-xs font-normal tracking-wider text-zinc-600">
            best 28
          </p>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
          <div className="h-full w-[46%] rounded-full bg-orange-400" />
        </div>
      </div>
    </div>
  );
};
