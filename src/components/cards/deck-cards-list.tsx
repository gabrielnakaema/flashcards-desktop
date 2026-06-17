import { useListCardsByDeck } from "@/hooks/cards/use-list-cards-by-deck";

interface DeckCardsListProps {
  deckId: string;
}

export const DeckCardsList = ({ deckId }: DeckCardsListProps) => {
  const { data: cards } = useListCardsByDeck(deckId);

  return (
    <div>
      {cards?.map((card) => (
        <div key={card.id}>
          <h1>{card.front}</h1>
        </div>
      ))}
    </div>
  );
};
