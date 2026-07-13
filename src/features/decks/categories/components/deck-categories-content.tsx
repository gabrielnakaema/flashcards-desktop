import { AppButton } from "@/shared/components/app-button";
import { AppInput } from "@/shared/components/app-input";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
import { useState } from "react";
import { useCreateDeckCategory } from "../hooks/use-create-deck-category";
import { useListDeckCategories } from "../hooks/use-list-deck-categories";
import { deckCategorySchema } from "../schemas/deck-category-schema";
import { DeckCategoryRow } from "./deck-category-row";

export const DeckCategoriesContent = () => {
  const {
    data: categories = [],
    isLoading,
    error: listError,
  } = useListDeckCategories();
  const createCategory = useCreateDeckCategory();
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string>();

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = deckCategorySchema.safeParse({ name });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      return;
    }

    setValidationError(undefined);
    createCategory.create(result.data, {
      onSuccess: () => setName(""),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="w-full max-w-[760px] px-9 py-8">
        <div className="mb-7">
          <h1 className="text-[22px] font-semibold tracking-tight">
            Categories
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Rename and remove the categories used to organize your decks.
          </p>
        </div>

        <section className="mb-5 rounded-sm border border-border bg-muted p-5">
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-medium">
                Move decks between categories
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Open a deck’s menu, choose Edit, then select another category.
                The change is saved with the deck and remains after restart.
              </p>
              <AppButton asChild variant="secondary" size="xs" className="mt-3">
                <Link to="/">
                  Browse decks
                  <ArrowRight />
                </Link>
              </AppButton>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            Manage categories
          </div>
          <div className="rounded-sm border border-border bg-muted p-5">
            <form className="flex items-end gap-2 " onSubmit={handleCreate}>
              <AppInput
                id="new-category-name"
                label="New category"
                placeholder="Enter category name"
                value={name}
                error={validationError ?? createCategory.error?.message}
                disabled={createCategory.isPending}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationError(undefined);
                  createCategory.reset();
                }}
                containerClassName="min-w-0 flex-1"
              />
              <AppButton
                type="submit"
                disabled={createCategory.isPending}
                className="h-12"
              >
                {createCategory.isPending ? "Creating..." : "Create"}
              </AppButton>
            </form>

            <div className="mt-5 flex flex-col gap-2">
              <p className="mb-1 font-mono text-[11px] text-muted-foreground">
                {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"}
              </p>

              {isLoading && (
                <p className="text-sm text-muted-foreground">
                  Loading categories...
                </p>
              )}
              {listError && (
                <p role="alert" className="text-sm text-destructive">
                  {listError.message}
                </p>
              )}
              {!isLoading && !listError && categories.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No categories yet. Create one above to get started.
                </p>
              )}
              {categories.map((category) => (
                <DeckCategoryRow key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
