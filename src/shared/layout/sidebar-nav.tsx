import { cn } from "@/shared/lib/utils";
import type { DeckWithStats } from "@/features/decks";
import { Link } from "@tanstack/react-router";
import { Home, Settings, SquareCheckBig } from "lucide-react";
import type { ReactNode } from "react";

const navLinkClasses =
  "flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-white";
const activeNavLinkClasses = "bg-white/10 text-white hover:bg-white/10";

type ReviewLinkProps =
  | { to: "/" }
  | { to: "/decks/$deckId/study"; params: { deckId: string } };

interface SidebarNavProps {
  decks: DeckWithStats[];
  pathname: string;
  reviewCardsDue: number;
  onNavigate?: () => void;
}

export const SidebarNav = ({
  decks,
  pathname,
  reviewCardsDue,
  onNavigate,
}: SidebarNavProps) => {
  const reviewLink = getReviewLink(decks);

  return (
    <ul className="flex flex-col gap-1">
      <li>
        <Link
          to="/"
          onClick={onNavigate}
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            navLinkClasses,
            pathname === "/" && activeNavLinkClasses
          )}
        >
          <Home className="size-4" />
          <span className="flex-1">Home</span>
        </Link>
      </li>
      <li>
        <Link {...reviewLink} onClick={onNavigate} className={navLinkClasses}>
          <SquareCheckBig className="size-4" />
          <span className="flex-1">Review</span>
          {renderReviewDueBadge(reviewCardsDue)}
        </Link>
      </li>
      {/* <li>
        <Link
          to="/generate"
          onClick={onNavigate}
          className={cn(
            navLinkClasses,
            pathname.startsWith("/generate") && activeNavLinkClasses
          )}
        >
          <Sparkles className="size-4" />
          <span className="flex-1">Generate</span>
          <span className="rounded-full bg-purple-950/25 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-100">
            AI
          </span>
        </Link>
      </li> */}
      <li>
        <Link
          to="/settings"
          onClick={onNavigate}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            navLinkClasses,
            pathname.startsWith("/settings") && activeNavLinkClasses
          )}
        >
          <Settings className="size-4" />
          <span className="flex-1">Settings</span>
        </Link>
      </li>
    </ul>
  );
};

const getReviewLink = (decks: DeckWithStats[]): ReviewLinkProps => {
  const firstDueDeck = decks.find((deck) => deck.cardsDue > 0);

  if (!firstDueDeck) {
    return { to: "/" };
  }

  return {
    to: "/decks/$deckId/study",
    params: { deckId: firstDueDeck.id },
  };
};

const renderReviewDueBadge = (reviewCardsDue: number): ReactNode => {
  if (reviewCardsDue <= 0) {
    return null;
  }

  return (
    <span className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-orange-400">
      {reviewCardsDue}
    </span>
  );
};
