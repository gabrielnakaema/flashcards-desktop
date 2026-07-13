import { cn } from "@/shared/lib/utils";
import type { DeckWithStats } from "@/features/decks";
import { Link } from "@tanstack/react-router";
import { FolderCog, Home, Settings, SquareCheckBig } from "lucide-react";
import type { ReactNode } from "react";

const navLinkClasses =
  "flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeNavLinkClasses =
  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent";

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
      <li>
        <Link
          to="/categories"
          onClick={onNavigate}
          aria-current={pathname.startsWith("/categories") ? "page" : undefined}
          className={cn(
            navLinkClasses,
            pathname.startsWith("/categories") && activeNavLinkClasses
          )}
        >
          <FolderCog className="size-4" />
          <span className="flex-1">Categories</span>
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
          <span className="rounded-full bg-info/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-info">
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
    <span className="rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-sidebar-primary">
      {reviewCardsDue}
    </span>
  );
};
