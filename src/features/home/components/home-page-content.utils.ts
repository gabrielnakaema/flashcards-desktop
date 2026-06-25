export type PageState = "caught-up" | "has-due-cards" | "no-cards" | "no-decks";

export type CardStatsData = {
  deckCount: number;
  totalCardsInDecks: number;
  cardsDueNow: number;
};

export const formatNextDueAt = (nextDueAt?: string | null): string => {
  if (!nextDueAt) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(nextDueAt));
};

export const getPageState = (data: CardStatsData | undefined): PageState => {
  if (data?.deckCount === 0) return "no-decks";
  if (data?.totalCardsInDecks === 0) return "no-cards";
  if (data?.cardsDueNow) return "has-due-cards";
  return "caught-up";
};

export const getCurrentTimeOfDay = (now = new Date()): string => {
  const hours = now.getHours();
  if (hours < 12) return "morning";
  if (hours < 18) return "afternoon";
  return "evening";
};

export const formatWelcomeDate = (now = new Date()): string => {
  return now
    .toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .replace(",", "");
};
