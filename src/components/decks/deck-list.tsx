import { useListDecks } from "@/hooks/decks/use-list-decks";
import { Layers } from "lucide-react";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckCard } from "./deck-card";

export const DeckList = () => {
  const { data: decks, isFetching } = useListDecks();

  if (isFetching) {
    return (
      <section className="w-full grid grid-cols-[repeat(auto-fit,minmax(300px,400px))] gap-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <DeckCard.Skeleton key={index} />
        ))}
      </section>
    );
  }

  if (decks?.length === 0) {
    return (
      <section className="w-full flex flex-col gap-4 flex-1 items-center justify-center">
        <div className="h-24 w-24 min-h-24 min-w-24 shadow-sm bg-muted/20 rounded-full p-4 flex items-center justify-center">
          <Layers className="size-8 text-foreground" />
        </div>

        <div className="flex flex-col gap-1 items-center justify-center">
          <h3 className="text-2xl font-medium text-foreground">
            Ready to start?
          </h3>
          <p className="text-base font-medium text-muted-foreground">
            Create your first deck to get started!
          </p>
        </div>

        <CreateDeckDialog />
      </section>
    );
  }

  return (
    <section className="w-full grid grid-cols-[repeat(auto-fit,minmax(300px,400px))] gap-6">
      {decks?.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </section>
  );
};
