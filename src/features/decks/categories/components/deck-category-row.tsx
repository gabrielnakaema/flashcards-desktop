import { DeckCategory } from "@/features/decks/types";
import {
  Check,
  Layers,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { useDeleteDeckCategory } from "@/features/decks/categories/hooks/use-delete-deck-category";
import { Input } from "@/shared/ui/input";
import { useUpdateDeckCategory } from "@/features/decks/categories/hooks/use-update-deck-category";

interface DeckCategoryRowProps {
  category: DeckCategory;
}

export const DeckCategoryRow = ({ category }: DeckCategoryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState(category.name || "");

  const onDeleteSuccess = () => {
    setIsDeleting(false);
  };

  const {
    remove,
    isPending: isLoadingDeleteCategory,
    error: deletingError,
  } = useDeleteDeckCategory(onDeleteSuccess);

  const onUpdateSuccess = () => {
    setIsEditing(false);
  };

  const {
    update,
    isPending: isLoadingUpdateCategory,
    error: editingError,
  } = useUpdateDeckCategory(onUpdateSuccess);

  const confirmUpdateName = () => {
    update({ id: category.id, name });
  };

  const renderActionButtons = () => {
    if (isDeleting) {
      return (
        <div className="flex items-center justify-end gap-1">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Are you sure?
          </p>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => remove(category.id)}
            disabled={isLoadingDeleteCategory}
            aria-label={`Delete ${category.name}`}
          >
            {isLoadingDeleteCategory ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleting(false)}
            aria-label={`Cancel deleting ${category.name}`}
          >
            <X />
          </Button>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="flex items-center justify-end gap-1 pl-2">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            size="icon-sm"
            onClick={() => setIsEditing(false)}
            aria-label={`Cancel editing ${category.name}`}
          >
            <X className="size-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-green-500"
            size="icon-sm"
            onClick={confirmUpdateName}
            disabled={isLoadingUpdateCategory}
            aria-label={`Update ${category.name}`}
          >
            {isLoadingUpdateCategory ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${category.name}`}
          onClick={() => setIsEditing(true)}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${category.name}`}
          disabled={isDeleting}
          onClick={() => {
            setIsDeleting(true);
          }}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    );
  };

  return (
    <article className="w-full flex flex-col border border-border rounded-lg p-2">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 min-w-8 rounded-md bg-muted flex items-center justify-center">
            <Layers className="size-4 text-foreground" />
          </div>
          {!isEditing && (
            <div>
              <div className="text-sm text-foreground">{category.name}</div>
              <p className="text-xs text-muted-foreground">
                {category.totalDecks}{" "}
                {category.totalDecks !== 1 ? "decks" : "deck"}
              </p>
            </div>
          )}

          {isEditing && (
            <div className="w-full">
              <label
                htmlFor={`category-name-${category.id}`}
                className="sr-only"
              >
                Name
              </label>
              <Input
                id={`category-name-${category.id}`}
                type="text"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoadingUpdateCategory}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    confirmUpdateName();
                  }
                }}
              />
            </div>
          )}
        </div>
        {renderActionButtons()}
      </div>

      {deletingError && (
        <p className="text-sm text-red-500">{deletingError.message}</p>
      )}
      {editingError && (
        <p className="text-sm text-red-500">{editingError.message}</p>
      )}
    </article>
  );
};
