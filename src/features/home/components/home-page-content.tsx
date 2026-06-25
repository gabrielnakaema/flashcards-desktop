import { useCardStats } from "@/features/cards";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { DeckList } from "@/features/decks";
import { CaughtUpBanner } from "./caught-up-banner";
import { DueCardsBanner } from "./due-cards-banner";
import {
  getCurrentTimeOfDay,
  getPageState,
  formatWelcomeDate,
} from "./home-page-content.utils";
import { NoCardsPrompt } from "./no-cards-prompt";
import { NoDecksPrompt } from "./no-decks-prompt";
import { Link } from "@tanstack/react-router";

export const HomePageContent = () => {
  const { data, isLoading, error } = useCardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center">
        <AlertCircle className="size-4 text-destructive" />
        Error: {error.message}
      </div>
    );
  }

  const pageState = getPageState(data);
  const deckIdToStartReview =
    pageState === "has-due-cards" ? data?.deckIdWithMostCardsDue : undefined;

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1">
      <section className="w-full flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Good {getCurrentTimeOfDay()}.
          </h1>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
            {formatWelcomeDate()}
          </p>
        </div>
      </section>

      {pageState === "has-due-cards" && data && deckIdToStartReview && (
        <DueCardsBanner data={data} deckIdToStartReview={deckIdToStartReview} />
      )}

      {pageState === "caught-up" && data && <CaughtUpBanner data={data} />}

      {pageState === "no-decks" && <NoDecksPrompt />}

      {pageState === "no-cards" && <NoCardsPrompt />}

      {!!data?.deckCount && (
        <section className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between w-full1">
            <h2 className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
              DECKS
            </h2>
            <Link
              to="/decks/create"
              className="text-xs text-muted-foreground tracking-widest hover:text-foreground transition-colors font-mono flex items-center gap-1 hover:underline"
            >
              <Plus className="size-3" />
              NEW DECK
            </Link>
          </div>

          <DeckList />
        </section>
      )}
    </div>
  );
};
