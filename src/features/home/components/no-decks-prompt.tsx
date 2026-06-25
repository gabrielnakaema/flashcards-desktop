import { Button } from "@/shared/ui/button";
import { BannerSection } from "./banner-section";

export const NoDecksPrompt = () => (
  <BannerSection className="flex-col gap-4">
    <p className="text-3xl font-bold tracking-tight text-white">
      flashcards<span className="text-orange-400">.</span>
    </p>
    <p className="text-sm text-foreground font-bold">Create your first deck</p>
    <p className="text-xs text-muted-foreground max-w-sm text-center">
      Organize flashcards into decks by topic, course, or language. The spaced
      repetition algorithm schedules each card at the optimal interval for
      long-term retention.
    </p>
    <Button className="bg-zinc-950/50 border-border border hover:bg-zinc-900/80 text-foreground rounded-sm p-3 px-5 h-fit">
      Create deck
    </Button>
  </BannerSection>
);
