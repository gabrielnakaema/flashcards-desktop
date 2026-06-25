import { EditDeckPageContent } from "@/features/decks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/decks/$deckId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();
  return <EditDeckPageContent deckId={deckId} />;
}
