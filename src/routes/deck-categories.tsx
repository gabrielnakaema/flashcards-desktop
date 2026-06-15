import { DeckCategoriesContent } from "@/components/deck-categories/deck-categories-content";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/deck-categories")({
  component: DeckCategoriesPage,
});

function DeckCategoriesPage() {
  return <DeckCategoriesContent />;
}
