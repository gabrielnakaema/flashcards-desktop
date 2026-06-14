import { DecksContent } from "@/components/decks/decks-content";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: DecksPage,
});

function DecksPage() {
  return <DecksContent />;
}
