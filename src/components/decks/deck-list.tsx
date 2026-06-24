import { useListDecks } from "@/hooks/decks/use-list-decks";
import { getDeckColor } from "@/utils/deck-colors";
import { DeckCard } from "./deck-card";

export const DeckList = () => {
  const { data: decks, isFetching } = useListDecks();

  if (isFetching) {
    return (
      <section className="w-full grid grid-cols-[repeat(auto-fit,minmax(300px,350px))] gap-6">
        {Array.from({ length: 10 }).map((_, index) => (
          <DeckCard.Skeleton key={index} />
        ))}
      </section>
    );
  }

  return (
    <section className="w-full grid grid-cols-[repeat(auto-fit,minmax(300px,350px))] gap-6">
      {decks?.map((deck, index) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          deckColorClassName={getDeckColor(index)}
        />
      ))}
    </section>
  );
};
