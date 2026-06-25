import { AppInput } from "@/shared/components/app-input";
import { AppSelect } from "@/shared/components/app-select";
import { SearchIcon, XIcon } from "lucide-react";
import {
  CARD_TYPE_FILTER_OPTIONS,
  DIFFICULTY_FILTER_OPTIONS,
  type CardListFilters,
  isCardTypeFilter,
  isDifficultyFilter,
} from "./card-list-filters";

interface DeckCardsToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: CardListFilters;
  onFiltersChange: (filters: Partial<CardListFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  totalCards: number;
  filteredCount: number;
}

export const DeckCardsToolbar = ({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  hasFilters,
  onClearFilters,
  totalCards,
  filteredCount,
}: DeckCardsToolbarProps) => {
  const summaryLabel = totalCards
    ? `${filteredCount} of ${totalCards} cards`
    : "No cards yet";

  return (
    <section className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Flashcards
          </h2>
          <p className="text-sm text-muted-foreground">{summaryLabel}</p>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <AppInput
            id="card-search"
            aria-label="Search flashcards"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search front, back, hints, or tags"
            className="pl-10"
          />
        </div>

        <AppSelect
          id="card-type-filter"
          aria-label="Filter by card type"
          value={filters.type}
          onChange={(type) => {
            if (isCardTypeFilter(type)) {
              onFiltersChange({ type });
            }
          }}
          options={[...CARD_TYPE_FILTER_OPTIONS]}
          placeholder="All types"
        />

        <AppSelect
          id="card-difficulty-filter"
          aria-label="Filter by difficulty"
          value={filters.difficulty}
          onChange={(difficulty) => {
            if (isDifficultyFilter(difficulty)) {
              onFiltersChange({ difficulty });
            }
          }}
          options={[...DIFFICULTY_FILTER_OPTIONS]}
          placeholder="All difficulties"
        />
      </div>
    </section>
  );
};
