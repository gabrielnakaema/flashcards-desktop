import { useListDecks } from "@/hooks/decks/use-list-decks";
import { CreateDeckDialog } from "./create-deck-dialog";

export const DecksContent = () => {
  const { data: decks } = useListDecks();

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

        <div>
          <CreateDeckDialog />
        </div>
      </section>

      <section>
        {decks?.map((deck) => (
          <div key={deck.id}>
            <h3>{deck.title}</h3>
          </div>
        ))}
      </section>
    </div>
  );
};
