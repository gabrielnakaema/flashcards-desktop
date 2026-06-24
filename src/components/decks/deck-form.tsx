import { deckFormSchema, DeckFormValues } from "@/schemas/deck-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { AppInput } from "@/components/shared/app-input";
import { CreatableSelect } from "@/components/shared/creatable-select";
import { useListDeckCategories } from "@/hooks/decks/use-list-deck-categories";
import { useCreateDeckCategory } from "@/hooks/decks/use-create-deck-category";
import { useUpdateDeck } from "@/hooks/decks/use-update-deck";
import { useEffect } from "react";
import { Deck } from "@/types/deck";
import { useCreateDeck } from "@/hooks/decks/use-create-deck";

interface DeckFormProps {
  deck?: Deck;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DeckForm = ({ deck, onSuccess, onCancel }: DeckFormProps) => {
  const isEdit = !!deck;

  const { data: categories } = useListDeckCategories();
  const { create, isPending: isCreating } = useCreateDeck();
  const { update, isPending: isUpdating } = useUpdateDeck();
  const { asyncCreate: createCategory, isPending: isCreatingCategory } =
    useCreateDeckCategory();

  const isPending = isCreating || isUpdating;

  const categoryOptions =
    categories?.map((category) => ({
      label: category.name,
      value: category.id,
    })) ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      title: "",
      tags: "",
      categoryId: "",
    },
  });

  useEffect(() => {
    reset({
      title: deck?.title ?? "",
      tags: deck?.tags.join(", ") ?? "",
      categoryId: deck?.category.id ?? "",
    });
  }, [deck, reset]);

  const onSubmit = async (data: DeckFormValues) => {
    const tags = data.tags?.split(",").map((t) => t.trim()) ?? [];
    if (isEdit) {
      await update({ id: deck.id, title: data.title, tags, categoryId: data.categoryId });
    } else {
      create({ title: data.title, tags, categoryId: data.categoryId });
    }
    onSuccess?.();
  };

  const submitButtonLabel = isEdit ? "Save deck" : "Create deck";

  return (
    <form
      className="w-full max-w-sm flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor="title"
          className="text-[11px] text-muted-foreground font-mono tracking-wide"
        >
          TITLE
        </label>
        <AppInput
          {...register("title")}
          id="title"
          placeholder="Enter title"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor="tags"
          className="text-[11px] text-muted-foreground font-mono tracking-wide"
        >
          TAGS
        </label>
        <AppInput
          {...register("tags")}
          id="tags"
          placeholder="e.g. math, science, history"
        />
        {errors.tags && (
          <p className="text-xs text-red-500">{errors.tags.message}</p>
        )}
      </div>

      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor="category"
          className="text-[11px] text-muted-foreground font-mono tracking-wide"
        >
          CATEGORY
        </label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState: { error } }) => (
            <>
              <CreatableSelect
                id="category"
                placeholder="Select category"
                emptyMessage="No categories found. Create a new category."
                options={categoryOptions}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                onCreate={async (query) => {
                  const result = await createCategory({ name: query });
                  field.onChange(result.id);
                }}
                isLoading={isCreatingCategory}
              />
              {error && (
                <p className="text-xs text-red-500">{error.message}</p>
              )}
            </>
          )}
        />
      </div>

      <div className="w-full flex items-center justify-end gap-2 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="w-fit rounded-sm border border-border bg-zinc-950 text-muted-foreground px-4 py-2 text-sm font-medium tracking-tight hover:bg-zinc-900 transition-colors font-mono"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-sm border border-orange-400 bg-orange-400 text-zinc-950 px-4 py-2 text-sm font-medium tracking-tight hover:bg-orange-500 hover:border-orange-500 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitButtonLabel}
        </button>
      </div>
    </form>
  );
};
