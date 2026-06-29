import { useListCardsByDeck } from "@/features/cards/hooks/use-list-cards-by-deck";
import { CardListItem } from "../card-list/card-list-item";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/features/cards/types";
import { CardForm } from "../card-form/card-form";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useDeleteCard } from "@/features/cards/hooks/use-delete-card";
import { useSuspendCard } from "@/features/cards/hooks/use-suspend-card";
import { useUnsuspendCard } from "@/features/cards/hooks/use-unsuspend-card";
import {
  DEFAULT_CARD_LIST_FILTERS,
  type CardListFilters,
  filterCards,
  hasActiveCardListFilters,
} from "../card-list/card-list-filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CardListEmptyState } from "../card-list/card-list-empty-state";
import { DeckCardsToolbar } from "./deck-cards-toolbar";

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
  const { suspend: suspendCard } = useSuspendCard();
  const { unsuspend: unsuspendCard } = useUnsuspendCard();

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
    <div className="flex w-full flex-col gap-6">
      <DeckCardsToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onFiltersChange={onFiltersChange}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
        totalCards={cards.length}
        filteredCount={filteredCards.length}
      />

      {isFetching && <CardListEmptyState variant="loading" />}

      {isError && (
        <CardListEmptyState
          variant="error"
          errorMessage={(error as Error).message}
        />
      )}

      {!isFetching && !isError && !cards.length && (
        <CardListEmptyState
          variant="no-cards"
          onCreateCard={onCreateCard}
        />
      )}

      {!isFetching &&
        !isError &&
        Boolean(cards.length) &&
        !filteredCards.length && (
          <CardListEmptyState
            variant="no-results"
            onClearFilters={handleClearFilters}
          />
        )}

      {!isFetching && !isError && Boolean(filteredCards.length) && (
        <div className="flex flex-col gap-3">
          {filteredCards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              onEdit={() => setEditingCard(card)}
              onDelete={() => setDeletingCard(card)}
              onSuspend={() => suspendCard(card.id)}
              onUnsuspend={() => unsuspendCard(card.id)}
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
