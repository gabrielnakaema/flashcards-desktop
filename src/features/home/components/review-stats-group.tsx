type StatItemProps = {
  value?: number;
  label: string;
};

const StatItem = ({ value, label }: StatItemProps) => (
  <div className="flex flex-col gap-1">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground font-mono">{label}</p>
  </div>
);

type ReviewStatsGroupProps = {
  cardsReviewedToday?: number;
  totalCardsReviewedThisWeek?: number;
  totalCardsInDecks?: number;
};

export const ReviewStatsGroup = ({
  cardsReviewedToday,
  totalCardsReviewedThisWeek,
  totalCardsInDecks,
}: ReviewStatsGroupProps) => (
  <div className="flex items-center gap-8 pl-8 border-l border-border">
    <StatItem value={cardsReviewedToday} label="reviewed today" />
    <StatItem value={totalCardsReviewedThisWeek} label="reviewed this week" />
    <StatItem value={totalCardsInDecks} label="total cards" />
  </div>
);
