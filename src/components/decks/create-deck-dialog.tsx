import { useCreateDeckCategory } from "@/hooks/decks/use-create-deck-category";
import { useCreateDeckForm } from "@/hooks/decks/use-create-deck-form";
import { useCallback, useState } from "react";
import { Controller } from "react-hook-form";
import { CreatableSelect } from "../shared/creatable-select";
import { Field } from "../shared/field";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { PlusIcon } from "lucide-react";

export const CreateDeckDialog = () => {
  const [open, setOpen] = useState(false);

  const onSuccessCallback = useCallback(() => {
    setOpen(false);
  }, []);

  const { formMethods, submit, isPending, categories } = useCreateDeckForm({
    onSuccess: onSuccessCallback,
  });

  const { create: createCategory, isPending: isCreatingCategory } =
    useCreateDeckCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) formMethods.reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg">
          <PlusIcon className="size-4" />
          Create deck
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>Create deck</DialogTitle>
            <DialogDescription>
              Create a new deck with a title, tags, and category.
            </DialogDescription>
          </div>
          <DialogClose />
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submit)}
          className="w-full flex flex-col gap-2"
        >
          <Field label="Title" error={errors.title?.message}>
            <Input
              {...register("title")}
              placeholder="Enter title"
              className="w-full"
            />
          </Field>
          <Field label="Tags" error={errors.tags?.message}>
            <Input
              {...register("tags")}
              placeholder="e.g. math, science, history"
              className="w-full"
            />
          </Field>

          <Controller
            control={formMethods.control}
            name="categoryId"
            render={({ field, fieldState: { error } }) => (
              <Field label="Category" error={error?.message}>
                <CreatableSelect
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
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                  value={field.value}
                  isLoading={isCreatingCategory}
                />
              </Field>
            )}
          />

          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="lg" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
