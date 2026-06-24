import { Loader2Icon, PlusIcon } from "lucide-react";

interface CardListEmptyStateProps {
  variant: "no-cards" | "no-results" | "loading" | "error";
  errorMessage?: string;
  onCreateCard?: () => void;
  onClearFilters?: () => void;
}

export const CardListEmptyState = ({
  variant,
  errorMessage,
  onCreateCard,
  onClearFilters,
}: CardListEmptyStateProps) => {
  if (variant === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-zinc-900/40 px-6 py-12 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading flashcards...
      </div>
    );
  }

  if (variant === "error") {
    return (
      <div
        role="alert"
        className="rounded-sm border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive"
      >
        {errorMessage ?? "Failed to load flashcards."}
      </div>
    );
  }

  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-zinc-900/40 px-6 py-12 text-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium text-foreground">
            No cards match your filters
          </h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term, type, or difficulty.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-sm border border-border bg-zinc-950 px-4 py-2 text-sm font-medium tracking-tight text-muted-foreground transition-colors hover:bg-zinc-900 hover:text-foreground font-mono"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-zinc-900/40 px-6 py-12 text-center">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">
          No flashcards yet
        </h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Add your first card manually or use the generator to draft a batch from
          your study material.
        </p>
      </div>
      {onCreateCard && (
        <button
          type="button"
          onClick={onCreateCard}
          className="inline-flex items-center gap-1.5 rounded-sm border border-orange-400 bg-orange-400 px-4 py-2 text-sm font-medium tracking-tight text-zinc-950 transition-colors hover:border-orange-500 hover:bg-orange-500 font-mono"
        >
          <PlusIcon className="size-3.5" />
          Create first flashcard
        </button>
      )}
    </div>
  );
};
