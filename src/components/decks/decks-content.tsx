import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckList } from "./deck-list";

export const DecksContent = () => {
  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1">
      <section className="w-full flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-medium text-foreground">Decks</h1>
          <h2 className="text-muted-foreground text-base">
            Manage your decks and categories.
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
