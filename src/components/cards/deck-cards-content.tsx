import { useDeckDetails } from "@/hooks/decks/use-deck-details";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GenerateCardsForm } from "./generate-cards-form";
import { useState } from "react";
import { DeckCardsList } from "./deck-cards-list";
import { CardForm } from "./card-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { CardListFilters } from "./card-list-filters";

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

  if (isFetching) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] gap-4 py-8 px-16">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch flex-1">
      <main className="w-full min-w-0 flex flex-col gap-8 py-8 px-6 lg:px-16">
        <section className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="lg" className="w-fit" asChild>
                <Link to="/">
                  <ArrowLeftIcon className="size-4" />
                  Back to decks
                </Link>
              </Button>

              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-medium text-foreground">
                  {deck?.title}
                </h1>
                <p className="text-xs bg-blue-500/20 text-blue-500 rounded-md px-2 py-1 capitalize font-medium w-fit">
                  {deck?.category.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <DeckCardsList
            deckId={deckId}
            filters={cardFilters}
            onFiltersChange={onCardFiltersChange}
            onCreateCard={() => setIsCreateDialogOpen(true)}
          />
        </section>
      </main>

      <aside className="w-full lg:max-w-md p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-border bg-muted/20">
        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          <GenerateCardsForm deck={deck!} />
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
    </div>
  );
};
