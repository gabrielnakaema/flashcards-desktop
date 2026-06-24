import { DeckForm } from "@/components/decks/deck-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/decks/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const handleBack = () => navigate({ to: "/" });

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-zinc-950">
      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-muted-foreground font-mono tracking-tight hover:text-foreground transition-colors flex items-center gap-1 py-2"
      >
        <ChevronLeft className="size-4" />
        back to decks
      </button>

      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        New deck
      </h1>

      <DeckForm onSuccess={handleBack} onCancel={handleBack} />
    </div>
  );
}
