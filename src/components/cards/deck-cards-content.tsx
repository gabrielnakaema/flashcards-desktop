import { useDeckDetails } from "@/hooks/decks/use-deck-details";
import { Loader2 } from "lucide-react";
import { GenerateCardsForm } from "./generate-cards-form";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DeckCardsList } from "./deck-cards-list";
import { CardForm } from "./card-form";

interface DeckCardsContentProps {
  deckId: string;
}

type View = "list" | "create";

export const DeckCardsContent = ({ deckId }: DeckCardsContentProps) => {
  const { data: deck, isFetching } = useDeckDetails(deckId);

  const [view, setView] = useState<View>("list");

  const tabBarClasses = "px-4 py-2 border-b-2 border-transparent";
  const activeTabClasses = "border-primary -mb-px";

  if (isFetching) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] gap-4 py-8 px-16">
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex items-stretch flex-1">
      <div className="w-full flex flex-col gap-4 py-8 px-16">
        <section className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium text-foreground">
              {deck?.title}
            </h1>
            <p className="text-xs bg-blue-500/20 text-blue-500 rounded-md px-2 py-1 capitalize font-medium w-fit">
              {deck?.category.name}
            </p>
          </div>
        </section>
        <section>
          <div className="w-full flex items-center border-b border-border">
            <button
              type="button"
              className={cn(tabBarClasses, view === "list" && activeTabClasses)}
              onClick={() => setView("list")}
            >
              List flashcards
            </button>
            <button
              type="button"
              className={cn(
                tabBarClasses,
                view === "create" && activeTabClasses
              )}
              onClick={() => setView("create")}
            >
              Create flashcards
            </button>
          </div>

          {view === "list" && <DeckCardsList deckId={deckId} />}
          {view === "create" && (
            <CardForm deckId={deckId} onSuccess={() => setView("list")} />
          )}
        </section>
      </div>
      <aside className="w-full max-w-md p-8 border-l border-border">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <GenerateCardsForm deck={deck!} />
        </div>
      </aside>
    </div>
  );
};
