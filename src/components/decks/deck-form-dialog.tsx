import { CreatableSelect } from "@/components/shared/creatable-select";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateDeckCategory } from "@/hooks/decks/use-create-deck-category";
import { useListDeckCategories } from "@/hooks/decks/use-list-deck-categories";
import { useUpdateDeck } from "@/hooks/decks/use-update-deck";
import {
  createDeckSchema,
  type CreateDeckForm,
} from "@/schemas/create-deck-schema";
import type { DeckWithStats } from "@/types/deck";
import { deckRepository } from "@/data/repositories";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "@/hooks/decks/decks-query-keys";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface DeckFormDialogProps {
  mode: "create" | "edit";
  deck?: DeckWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeckFormDialog = ({
  mode,
  deck,
  open,
  onOpenChange,
}: DeckFormDialogProps) => {
  const isEdit = mode === "edit";

  const { data: categories } = useListDeckCategories();
  const { asyncCreate: createCategory, isPending: isCreatingCategory } =
    useCreateDeckCategory();
  const { update, isPending: isUpdating } = useUpdateDeck();

  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: deckRepository.createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
    },
  });

  const isPending = createMutation.isPending || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
    defaultValues: {
      title: deck?.title ?? "",
      tags: deck?.tags.join(", ") ?? "",
      categoryId: deck?.category.id ?? "",
    },
  });

  useEffect(() => {
    reset({
      title: deck?.title ?? "",
      tags: deck?.tags.join(", ") ?? "",
      categoryId: deck?.category.id ?? "",
    });
  }, [deck, open, reset]);

  const onSubmit = async (values: CreateDeckForm) => {
    const tags = values.tags?.split(",").map((t) => t.trim()) ?? [];

    try {
      if (isEdit && deck) {
        await update({
          id: deck.id,
          title: values.title,
          tags,
          categoryId: values.categoryId,
        });
      } else {
        await createMutation.mutateAsync({
          title: values.title,
          tags,
          categoryId: values.categoryId,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  };

  const defaultValues = {
    title: deck?.title ?? "",
    tags: deck?.tags.join(", ") ?? "",
    categoryId: deck?.category.id ?? "",
  };

  const title = isEdit ? "Edit deck" : "Create deck";
  const description = isEdit
    ? "Update the deck title, tags, and category."
    : "Create a new deck with a title, tags, and category.";
  const submitLabel = isEdit ? "Save" : "Create";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset(defaultValues);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <DialogClose />
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-2"
        >
          <Field
            label="Title"
            htmlFor="deck-title"
            error={errors.title?.message}
          >
            <Input
              {...register("title")}
              id="deck-title"
              placeholder="Enter title"
              className="w-full"
            />
          </Field>

          <Field label="Tags" htmlFor="deck-tags" error={errors.tags?.message}>
            <Input
              {...register("tags")}
              id="deck-tags"
              placeholder="e.g. math, science, history"
              className="w-full"
            />
          </Field>

          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState: { error } }) => (
              <Field
                label="Category"
                htmlFor="deck-category"
                error={error?.message}
              >
                <CreatableSelect
                  id="deck-category"
                  emptyMessage="No categories found. Create a new category."
                  options={
                    categories?.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })) ?? []
                  }
                  onCreate={async (query: string) => {
                    const result = await createCategory({ name: query });
                    field.onChange(result.id);
                  }}
                  onChange={(value) => field.onChange(value)}
                  value={field.value}
                  isLoading={isCreatingCategory}
                />
              </Field>
            )}
          />

          {errors.root?.message && (
            <p className="text-sm text-red-500">{errors.root.message}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="lg" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
