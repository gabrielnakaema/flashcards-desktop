import { useListDecks } from "@/hooks/decks/use-list-decks";
import { DeckCard } from "./deck-card";

export const DeckList = () => {
  const { data: decks } = useListDecks();

  return (
    <section className="w-full grid grid-cols-[repeat(auto-fit,minmax(300px,400px))] gap-6">
      {decks?.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </section>
  );
};
