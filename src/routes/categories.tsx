import { DeckCategoriesContent } from "@/features/decks/categories";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/categories")({
  component: DeckCategoriesContent,
});
