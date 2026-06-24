import { DeckGenerateCardsContent } from "@/components/cards/deck-generate-cards-content";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/decks/$deckId/generate")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();

  return <DeckGenerateCardsContent deckId={deckId} />;
}
