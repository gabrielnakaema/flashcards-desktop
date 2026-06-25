import { CreateDeckPageContent } from "@/features/decks";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/decks/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CreateDeckPageContent />;
}
