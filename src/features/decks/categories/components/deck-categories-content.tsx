import { Field } from "@/shared/components/field";
import { Button } from "@/shared/ui/button";
import { useCreateDeckCategory } from "@/features/decks/categories/hooks/use-create-deck-category";
import { useListDeckCategories } from "@/features/decks/categories/hooks/use-list-deck-categories";
import { Layers, Loader2Icon, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { DeckCategoryRow } from "./deck-category-row";

interface DeckCategoriesContentProps {
  onClose: () => void;
}

export const DeckCategoriesContent = ({
  onClose,
}: DeckCategoriesContentProps) => {
  const { data: categories, isLoading } = useListDeckCategories();
  const { create, isPending: isCreating } = useCreateDeckCategory();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isCreating) {
      return;
    }

    create({ name });
    setName("");
  };

  return (
    <div className="w-full flex flex-col h-screen overflow-hidden">
      <section className="w-full flex justify-between border-b border-border p-6">
        <div className="flex flex-col">
          <h3 className="text-xl font-medium text-foreground">Categories</h3>
          <p className="text-sm text-muted-foreground">
            Group your decks. Used across your library.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2"
          type="button"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </section>

      <form
        className="w-full flex items-end gap-2 p-6 border-b border-border"
        onSubmit={handleSubmit}
      >
        <Field
          label="New category"
          htmlFor="category-name"
          containerClassName="flex-1"
        >
          <Input
            id="category-name"
            placeholder="Enter category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
            required
          />
        </Field>

        <Button
          type="submit"
          disabled={isCreating}
          className="min-w-20 w-fit"
          variant="secondary"
        >
          {isCreating ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
      </form>

      <section className="p-6 w-full flex flex-col gap-2 flex-1 overflow-y-auto">
        <p className="text-xs text-muted-foreground">
          {categories?.length === 1
            ? "1 category"
            : `${categories?.length} categories`}
        </p>
        {isLoading && (
          <div>
            <div className="text-muted-foreground">Loading categories...</div>
          </div>
        )}
        {categories?.map((category) => (
          <DeckCategoryRow key={category.id} category={category} />
        ))}
        {!isLoading && !categories?.length && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 min-w-24 min-h-24 rounded-full bg-muted/50 flex items-center justify-center">
              <Layers className="size-10 text-foreground" />
            </div>

            <div className="text-muted-foreground text-center mt-4">
              There are no categories yet. <br /> Create one above to get
              started!
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-border p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClose}
        >
          Done
        </Button>
      </section>
    </div>
  );
};
