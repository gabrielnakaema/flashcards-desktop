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
import { useUpdateDeckCategory } from "@/hooks/decks/use-update-deck-category";
import {
  deckCategorySchema,
  type DeckCategoryForm,
} from "@/schemas/deck-category-schema";
import type { DeckCategory } from "@/types/deck";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface CategoryFormDialogProps {
  mode: "create" | "edit";
  category?: DeckCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryFormDialog = ({
  mode,
  category,
  open,
  onOpenChange,
}: CategoryFormDialogProps) => {
  const { create, isPending: isCreating } = useCreateDeckCategory();
  const { update, isPending: isUpdating } = useUpdateDeckCategory();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeckCategoryForm>({
    resolver: zodResolver(deckCategorySchema),
    defaultValues: {
      name: category?.name ?? "",
    },
  });

  useEffect(() => {
    reset({ name: category?.name ?? "" });
  }, [category, open, reset]);

  const onSubmit = async (values: DeckCategoryForm) => {
    if (mode === "create") {
      await create({ name: values.name });
    } else if (category) {
      await update({ id: category.id, name: values.name });
    }

    onOpenChange(false);
  };

  const title = mode === "create" ? "Create category" : "Edit category";
  const description =
    mode === "create"
      ? "Add a new deck category."
      : "Update the category name.";
  const submitLabel = mode === "create" ? "Create" : "Save";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset({ name: category?.name ?? "" });
        }
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
            label="Name"
            htmlFor="category-name"
            error={errors.name?.message}
          >
            <Input
              {...register("name")}
              id="category-name"
              placeholder="Enter category name"
              className="w-full"
            />
          </Field>

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
