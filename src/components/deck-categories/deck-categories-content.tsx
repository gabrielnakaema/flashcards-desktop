import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteDeckCategory } from "@/hooks/decks/use-delete-deck-category";
import { useListDeckCategories } from "@/hooks/decks/use-list-deck-categories";
import type { DeckCategory } from "@/types/deck";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { CategoryFormDialog } from "./category-form-dialog";

export const DeckCategoriesContent = () => {
  const { data: categories, isLoading } = useListDeckCategories();
  const { remove, isPending: isDeleting } = useDeleteDeckCategory();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    DeckCategory | undefined
  >();
  const [deletingCategory, setDeletingCategory] = useState<
    DeckCategory | undefined
  >();
  const [deleteError, setDeleteError] = useState<string>();

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setDeleteError(undefined);

    try {
      await remove(deletingCategory.id);
      setDeletingCategory(undefined);
    } catch {
      setDeleteError(
        "Could not delete this category. It may still be used by one or more decks."
      );
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16">
      <section className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
            <Link to="/">
              <ArrowLeftIcon className="size-4" />
              Back to decks
            </Link>
          </Button>
          <h1 className="text-3xl font-medium text-primary">Deck categories</h1>
          <p className="text-foreground text-base">
            Create, edit, and remove categories used when organizing decks.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
          Create category
        </Button>
      </section>

      <section className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : categories?.length ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditingCategory(category)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${category.name}`}
                        disabled={isDeleting}
                        onClick={() => {
                          setDeleteError(undefined);
                          setDeletingCategory(category);
                        }}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  No categories yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <CategoryFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <CategoryFormDialog
        mode="edit"
        category={editingCategory}
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(undefined);
            setDeleteError(undefined);
          }
        }}
        title={`Delete "${deletingCategory?.name}"?`}
        description="This action cannot be undone. Decks using this category may prevent deletion."
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        cancelLabel="Cancel"
        variant="destructive"
        isPending={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
