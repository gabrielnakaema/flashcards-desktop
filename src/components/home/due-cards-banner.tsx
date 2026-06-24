import type { CardStats } from "@/data/card-repository";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "../ui/button";
import { BannerSection } from "./banner-section";
import { ReviewStatsGroup } from "./review-stats-group";

type DueCardsBannerProps = {
  data: CardStats;
  deckIdToStartReview: string;
};

export const DueCardsBanner = ({
  data,
  deckIdToStartReview,
}: DueCardsBannerProps) => (
  <BannerSection>
    <div className="flex gap-12 items-center">
      <div className="flex flex-col gap-1">
        <p className="text-4xl font-bold text-orange-400">{data.cardsDueNow}</p>
        <p className="text-xs text-muted-foreground font-mono">cards due now</p>
      </div>

      <ReviewStatsGroup
        cardsReviewedToday={data.cardsReviewedToday}
        totalCardsReviewedThisWeek={data.totalCardsReviewedThisWeek}
        totalCardsInDecks={data.totalCardsInDecks}
      />
    </div>

    <Button
      className="bg-orange-400 text-zinc-900 hover:bg-orange-400/80 font-semibold text-lg py-6 rounded-sm px-8 flex items-center gap-2 tracking-tight"
      type="button"
      asChild
    >
      <Link to="/decks/$deckId/study" params={{ deckId: deckIdToStartReview }}>
        Start session
        <Play className="size-5" />
      </Link>
    </Button>
  </BannerSection>
);
