import { DeckForm } from "@/components/decks/deck-form";
import { useDeckDetails } from "@/hooks/decks/use-deck-details";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/decks/$deckId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const { data: deck, isLoading, isError } = useDeckDetails(deckId);

  const handleBack = () =>
    navigate({ to: "/decks/$deckId/cards", params: { deckId } });

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-zinc-950">
        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
      </div>
    );
  }

  if (isError || !deck) {
    return (
      <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-zinc-950">
        <p className="text-sm text-red-500 font-mono">Failed to load deck.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-zinc-950">
      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-muted-foreground font-mono tracking-tight hover:text-foreground transition-colors flex items-center gap-1 py-2"
      >
        <ChevronLeft className="size-4" />
        back to deck
      </button>

      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        Edit deck
      </h1>

      <DeckForm deck={deck} onSuccess={handleBack} onCancel={handleBack} />
    </div>
  );
}
