import { DevStudyTools } from "@/features/dev";
import { useDeckDetails } from "@/features/decks";
import { useSettings } from "@/features/settings";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { CardForm } from "./card-form";
import type { CardListFilters } from "./card-list-filters";
import { DeckCardsHeader } from "./deck-cards-header";
import { DeckCardsList } from "./deck-cards-list";

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
    <div className="flex w-full flex-1 flex-col overflow-hidden bg-zinc-950">
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden rounded-sm border border-border bg-zinc-950 p-0 sm:max-w-2xl">
          <DialogTitle className="sr-only">Create flashcard</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new flashcard to this deck.
          </DialogDescription>
          <CardForm
            deckId={deckId}
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {showDevStudyTools && <DevStudyTools deckId={deckId} />}
    </div>
  );
};
