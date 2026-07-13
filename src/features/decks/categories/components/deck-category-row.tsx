import type { DeckCategory } from "@/features/decks/types";
import { AppInput } from "@/shared/components/app-input";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/shared/ui/button";
import { Check, Layers, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useDeleteDeckCategory } from "../hooks/use-delete-deck-category";
import { useUpdateDeckCategory } from "../hooks/use-update-deck-category";
import { deckCategorySchema } from "../schemas/deck-category-schema";

interface DeckCategoryRowProps {
  category: DeckCategory;
}

export const DeckCategoryRow = ({ category }: DeckCategoryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(category.name);
  const [validationError, setValidationError] = useState<string>();
  const updateCategory = useUpdateDeckCategory();
  const deleteCategory = useDeleteDeckCategory();

  const beginEditing = () => {
    updateCategory.reset();
    setValidationError(undefined);
    setName(category.name);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    updateCategory.reset();
    setValidationError(undefined);
    setName(category.name);
    setIsEditing(false);
  };

  const submitUpdate = () => {
    const result = deckCategorySchema.safeParse({ name });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      return;
    }

    setValidationError(undefined);
    updateCategory.update(
      { id: category.id, name: result.data.name },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const closeDeleteDialog = () => {
    if (deleteCategory.isPending) return;
    deleteCategory.reset();
    setIsDeleting(false);
  };

  const deleteDescription =
    category.totalDecks > 0
      ? `This category contains ${category.totalDecks} ${
          category.totalDecks === 1 ? "deck" : "decks"
        }. Decks and cards are never deleted automatically. Move or delete those decks before deleting the category.`
      : "This action cannot be undone. Decks and cards are never deleted automatically.";

  return (
    <article className="rounded-sm border border-border bg-muted px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-background">
            <Layers className="size-4 text-muted-foreground" />
          </div>

          {isEditing ? (
            <AppInput
              id={`category-name-${category.id}`}
              label="Name"
              value={name}
              error={validationError ?? updateCategory.error?.message}
              disabled={updateCategory.isPending}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitUpdate();
                }
                if (event.key === "Escape") cancelEditing();
              }}
              autoFocus
              containerClassName="min-w-0 flex-1"
            />
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {category.name}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {category.totalDecks} {category.totalDecks === 1 ? "deck" : "decks"}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Cancel editing ${category.name}`}
                disabled={updateCategory.isPending}
                onClick={cancelEditing}
              >
                <X />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                aria-label={`Save ${category.name}`}
                disabled={updateCategory.isPending}
                onClick={submitUpdate}
              >
                <Check />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${category.name}`}
                onClick={beginEditing}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${category.name}`}
                onClick={() => {
                  deleteCategory.reset();
                  setIsDeleting(true);
                }}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isDeleting}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
        title={`Delete “${category.name}”?`}
        description={deleteDescription}
        confirmLabel="Delete category"
        pendingLabel="Deleting..."
        cancelLabel="Cancel"
        variant="destructive"
        isPending={deleteCategory.isPending}
        error={deleteCategory.error?.message}
        onConfirm={() =>
          deleteCategory.remove(category.id, {
            onSuccess: () => setIsDeleting(false),
          })
        }
      />
    </article>
  );
};
