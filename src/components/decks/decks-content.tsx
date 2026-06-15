import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckList } from "./deck-list";

export const DecksContent = () => {
  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16">
      <section className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium text-primary">Deck dashboard</h1>
          <h2 className="text-foreground text-base">
            You have <strong>142</strong> cards due today across{" "}
            <strong>6</strong> decks
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="lg" asChild>
            <Link to="/deck-categories">Manage deck categories</Link>
          </Button>
          <CreateDeckDialog />
        </div>
      </section>

      <DeckList />
    </div>
  );
};
