import { DeckCardsContent } from "@/components/cards/deck-cards-content";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/decks/$deckId/cards")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();

  return <DeckCardsContent deckId={deckId} />;
}
