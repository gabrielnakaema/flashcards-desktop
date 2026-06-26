import { deckFormSchema, DeckFormValues } from "@/features/decks/schemas/deck-form.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { AppInput } from "@/shared/components/app-input";
import { AppButton } from "@/shared/components/app-button";
import { CreatableSelect } from "@/shared/components/creatable-select";
import { useListDeckCategories } from "@/features/decks/categories/hooks/use-list-deck-categories";
import { useCreateDeckCategory } from "@/features/decks/categories/hooks/use-create-deck-category";
import { useUpdateDeck } from "@/features/decks/hooks/use-update-deck";
import { useEffect } from "react";
import { Deck } from "@/features/decks/types";
import { useCreateDeck } from "@/features/decks/hooks/use-create-deck";

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

  const onSubmit = (data: DeckFormValues) => {
    const tags = data.tags?.split(",").map((t) => t.trim()) ?? [];
    if (isEdit) {
      update(
        { id: deck.id, title: data.title, tags, categoryId: data.categoryId },
        { onSuccess: () => onSuccess?.() }
      );
    } else {
      create(
        { title: data.title, tags, categoryId: data.categoryId },
        { onSuccess: () => onSuccess?.() }
      );
    }
  };

  const submitButtonLabel = isEdit ? "Save deck" : "Create deck";

  return (
    <form
      className="w-full max-w-sm flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <AppInput
        {...register("title")}
        id="title"
        label="Title"
        placeholder="Enter title"
        error={errors.title?.message}
      />

      <AppInput
        {...register("tags")}
        id="tags"
        label="Tags"
        placeholder="e.g. math, science, history"
        error={errors.tags?.message}
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field, fieldState: { error } }) => (
          <CreatableSelect
            id="category"
            label="Category"
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
            error={error?.message}
          />
        )}
      />

      <div className="w-full flex items-center justify-end gap-2 pt-6 border-t border-border">
        <AppButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton type="submit" disabled={isPending}>
          {submitButtonLabel}
        </AppButton>
      </div>
    </form>
  );
};
