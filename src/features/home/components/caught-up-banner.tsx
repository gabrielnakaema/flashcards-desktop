import type { CardStats } from "@/features/cards";
import { Check } from "lucide-react";
import { BannerSection } from "./banner-section";
import { formatNextDueAt } from "./home-page-content.utils";
import { ReviewStatsGroup } from "./review-stats-group";

type CaughtUpBannerProps = {
  data: CardStats;
};

export const CaughtUpBanner = ({ data }: CaughtUpBannerProps) => (
  <BannerSection>
    <div className="flex gap-12 items-center">
      <div className="flex flex-col gap-2 items-center">
        <div className="border border-green-600 rounded-full h-12 w-12 min-h-12 min-w-12 flex items-center justify-center bg-green-600/10">
          <Check className="size-4 text-green-600" />
        </div>

        <p className="text-sm font-bold text-foreground">All caught up!</p>

        <p className="text-[10px] text-muted-foreground tracking-tight font-mono">
          next due in {formatNextDueAt(data.nextDueAt)}
        </p>
      </div>

      <ReviewStatsGroup
        cardsReviewedToday={data.cardsReviewedToday}
        totalCardsReviewedThisWeek={data.totalCardsReviewedThisWeek}
        totalCardsInDecks={data.totalCardsInDecks}
      />
    </div>
  </BannerSection>
);
