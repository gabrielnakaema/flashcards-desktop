import { Loader2Icon, PlusIcon } from "lucide-react";
import { AppButton } from "@/shared/components/app-button";

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
          <AppButton type="button" variant="secondary" onClick={onClearFilters}>
            Clear filters
          </AppButton>
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
        <AppButton type="button" onClick={onCreateCard}>
          <PlusIcon className="size-3.5" />
          Create first flashcard
        </AppButton>
      )}
    </div>
  );
};
