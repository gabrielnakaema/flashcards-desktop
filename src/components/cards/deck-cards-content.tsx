import { DevStudyTools } from "@/components/dev/dev-study-tools";
import { useDeckDetails } from "@/hooks/decks/use-deck-details";
import { useSettings } from "@/hooks/settings/use-settings";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CardForm } from "./card-form";
import type { CardListFilters } from "./card-list-filters";
import { DeckCardsHeader } from "./deck-cards-header";
import { DeckCardsList } from "./deck-cards-list";
import { GenerateCardsForm } from "./generate-cards-form";

interface DeckCardsContentProps {
  deckId: string;
  cardFilters: CardListFilters;
  onCardFiltersChange: (filters: Partial<CardListFilters>) => void;
}

export const DeckCardsContent = ({
  deckId,
  cardFilters,
  onCardFiltersChange,
}: DeckCardsContentProps) => {
  const { data: deck, isFetching } = useDeckDetails(deckId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: settings } = useSettings();
  const showDevStudyTools = settings.devMode === "on";

  if (isFetching) {
    return (
      <div className="flex min-h-[70vh] w-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-950 px-16 py-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden bg-zinc-950 lg:flex-row">
      <main className="flex min-w-0 flex-1 flex-col gap-8 overflow-auto px-6 py-8 lg:px-16">
        {deck && (
          <DeckCardsHeader
            deckId={deckId}
            deckTitle={deck.title}
            categoryName={deck.category.name ?? "Uncategorized"}
            deckTags={deck.tags}
            onCreateCard={() => setIsCreateDialogOpen(true)}
          />
        )}

        <DeckCardsList
          deckId={deckId}
          filters={cardFilters}
          onFiltersChange={onCardFiltersChange}
          onCreateCard={() => setIsCreateDialogOpen(true)}
        />
      </main>

      <aside className="h-full w-full overflow-auto border-t border-border bg-zinc-950/80 p-6 lg:max-w-md lg:border-t-0 lg:border-l lg:p-8">
        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          {deck && <GenerateCardsForm deck={deck} />}
        </div>
      </aside>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Create flashcard</DialogTitle>
            <DialogDescription>
              Add a new flashcard to this deck.
            </DialogDescription>
          </DialogHeader>
          <CardForm
            deckId={deckId}
            onSuccess={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {showDevStudyTools && <DevStudyTools deckId={deckId} />}
    </div>
  );
};
