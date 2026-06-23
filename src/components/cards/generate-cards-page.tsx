import { GenerateCardsForm } from "@/components/cards/generate-cards-form";
import { Field } from "@/components/shared/field";
import { Select } from "@/components/shared/select";
import { useListDecks } from "@/hooks/decks/use-list-decks";
import { Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { GenerateCardsPageLayout } from "./generate-cards-page-layout";

export const GenerateCardsPage = () => {
  const { data: decks = [], isFetching } = useListDecks();
  const [selectedDeckId, setSelectedDeckId] = useState("");

  const deckOptions = useMemo(
    () => decks.map((deck) => ({ label: deck.title, value: deck.id })),
    [decks],
  );
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  if (isFetching) {
    return (
      <div
        role="status"
        aria-label="Loading decks"
        className="flex min-h-[70vh] items-center justify-center"
      >
        <Loader2 className="size-10 animate-spin" />
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <GenerateCardsPageLayout>
        <section className="rounded-md border border-border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-medium text-foreground">
            Create a deck first
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Generated cards need a destination deck before they can be saved.
          </p>
        </section>
      </GenerateCardsPageLayout>
    );
  }

  return (
    <GenerateCardsPageLayout>
      <section className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="h-fit rounded-md border border-border bg-muted/30 p-4">
          <Field label="Deck" htmlFor="generate-deck">
            <Select
              id="generate-deck"
              value={selectedDeckId}
              onChange={setSelectedDeckId}
              options={deckOptions}
              placeholder="Choose a deck"
              className="w-full"
            />
          </Field>
        </aside>

        <div className="min-w-0 rounded-md border border-border bg-background p-4 lg:p-6">
          {selectedDeck ? (
            <GenerateCardsForm deck={selectedDeck} />
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center">
              <Sparkles className="size-10 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-medium text-foreground">
                Select a deck to generate cards
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                The prompt will start with that deck as the generation topic.
              </p>
            </div>
          )}
        </div>
      </section>
    </GenerateCardsPageLayout>
  );
};
