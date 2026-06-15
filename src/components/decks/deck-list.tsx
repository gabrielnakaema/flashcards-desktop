import { useListDecks } from "@/hooks/decks/use-list-decks";
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
      <section className="w-full flex flex-col gap-4 pt-4">
        <p className="text-muted-foreground">
          No decks found. Create a deck to get started.
        </p>
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
