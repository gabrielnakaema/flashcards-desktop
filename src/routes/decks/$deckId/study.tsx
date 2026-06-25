import { StudyScreen } from "@/features/study";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/decks/$deckId/study")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();
  return <StudyScreen deckId={deckId} />;
}
