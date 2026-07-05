import { PlusSquare } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { BannerSection } from "./banner-section";

export const NoCardsPrompt = () => (
  <BannerSection className="gap-4">
    <div className="flex items-center gap-8">
      <div className="h-16 w-16 min-w-16 rounded-sm border border-border flex items-center justify-center bg-muted text-muted-foreground">
        <PlusSquare className="size-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">
          Your decks have no cards yet
        </p>
        <p className="text-xs text-muted-foreground">
          Add cards manually, or generate a set with AI to get started
        </p>
      </div>
    </div>
    <Button className="bg-background/50 border-border border hover:bg-muted/80 text-foreground rounded-sm p-3 px-5 h-fit">
      Add card
    </Button>
  </BannerSection>
);
