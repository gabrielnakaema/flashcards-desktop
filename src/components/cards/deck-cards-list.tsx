import { useListCardsByDeck } from "@/hooks/cards/use-list-cards-by-deck";
import { CardListItem } from "./card-list-item";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/types/card";
import { CardForm } from "./card-form";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { useDeleteCard } from "@/hooks/cards/use-delete-card";
import { Loader2Icon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field } from "../shared/field";
import { Select } from "../shared/select";
import {
  CARD_TYPE_FILTER_OPTIONS,
  DEFAULT_CARD_LIST_FILTERS,
  DIFFICULTY_FILTER_OPTIONS,
  type CardListFilters,
  filterCards,
  hasActiveCardListFilters,
  isCardTypeFilter,
  isDifficultyFilter,
} from "./card-list-filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DeckCardsListProps {
  deckId: string;
  filters: CardListFilters;
  onFiltersChange: (filters: Partial<CardListFilters>) => void;
  onCreateCard?: () => void;
}

export const DeckCardsList = ({
  deckId,
  filters,
  onFiltersChange,
  onCreateCard,
}: DeckCardsListProps) => {
  const {
    data: cards = [],
    isFetching,
    isError,
    error,
  } = useListCardsByDeck(deckId);
  const {
    delete: deleteCard,
    isPending: isDeletingCard,
    error: deleteError,
  } = useDeleteCard({
    onSuccess: () => {
      setDeletingCard(null);
    },
  });

  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search);
  const filteredCards = useMemo(
    () => filterCards(cards, filters),
    [cards, filters]
  );
  const hasFilters =
    hasActiveCardListFilters(filters) || Boolean(searchValue.trim());

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchValue === filters.search) return;

    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ search: searchValue });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search, onFiltersChange, searchValue]);

  const handleConfirmDelete = () => {
    if (!deletingCard) return;
    deleteCard(deletingCard.id);
  };

  const handleClearFilters = () => {
    setSearchValue(DEFAULT_CARD_LIST_FILTERS.search);
    onFiltersChange(DEFAULT_CARD_LIST_FILTERS);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Flashcards</h2>
            <p className="text-sm text-muted-foreground">
              {cards.length
                ? `${filteredCards.length} of ${cards.length} cards shown`
                : "Create cards manually or generate drafts from the sidebar."}
            </p>
          </div>

          {onCreateCard && (
            <Button type="button" onClick={onCreateCard} className="w-fit">
              <PlusIcon className="size-4" />
              Create flashcard
            </Button>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-center">
          <Field
            label="Search flashcards"
            htmlFor="card-search"
            labelClassName="sr-only"
          >
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="card-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search front, back, hints, explanations, or tags"
                className="pl-9"
              />
            </div>
          </Field>

          <Field
            label="Filter by card type"
            htmlFor="card-type-filter"
            labelClassName="sr-only"
          >
            <Select
              id="card-type-filter"
              value={filters.type}
              onChange={(type) => {
                if (isCardTypeFilter(type)) {
                  onFiltersChange({ type });
                }
              }}
              options={[...CARD_TYPE_FILTER_OPTIONS]}
              className="w-full"
            />
          </Field>

          <Field
            label="Filter by difficulty"
            htmlFor="card-difficulty-filter"
            labelClassName="sr-only"
          >
            <Select
              id="card-difficulty-filter"
              value={filters.difficulty}
              onChange={(difficulty) => {
                if (isDifficultyFilter(difficulty)) {
                  onFiltersChange({ difficulty });
                }
              }}
              options={[...DIFFICULTY_FILTER_OPTIONS]}
              className="w-full"
            />
          </Field>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearFilters}
              className="w-fit"
            >
              <XIcon className="size-4" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isFetching && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading flashcards...
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {(error as Error).message}
        </div>
      )}

      {!isFetching && !isError && !cards.length && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium text-foreground">
              No flashcards yet
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Add your first card manually or use the generator to draft a batch
              from your study material.
            </p>
          </div>
          {onCreateCard && (
            <Button type="button" onClick={onCreateCard}>
              <PlusIcon className="size-4" />
              Create first flashcard
            </Button>
          )}
        </div>
      )}

      {!isFetching &&
        !isError &&
        Boolean(cards.length) &&
        !filteredCards.length && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium text-foreground">
                No cards match your filters
              </h3>
              <p className="text-sm text-muted-foreground">
                Try a different search term, type, or difficulty.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}

      {!isFetching && !isError && Boolean(filteredCards.length) && (
        <div className="flex flex-col gap-4">
          {filteredCards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              onEdit={() => setEditingCard(card)}
              onDelete={() => setDeletingCard(card)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCard(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit flashcard</DialogTitle>
            <DialogDescription>
              Update this flashcard without leaving the list.
            </DialogDescription>
          </DialogHeader>
          {editingCard && (
            <CardForm
              card={editingCard}
              deckId={deckId}
              onSuccess={() => setEditingCard(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCard(null);
          }
        }}
        title="Are you sure you want to delete this flashcard?"
        description="This action cannot be undone. The flashcard will be permanently removed from the deck."
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        cancelLabel="Cancel"
        variant="destructive"
        isPending={isDeletingCard}
        error={deleteError?.message}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
