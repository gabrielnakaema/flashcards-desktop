import { Button } from "@/components/ui/button";
import { useCreateCard } from "@/hooks/cards/use-create-card";
import { useUpdateCard } from "@/hooks/cards/use-update-card";
import {
  cardFormSchema,
  cardToFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  getDefaultCardFormValues,
  type CardFormValues,
} from "@/schemas/card-form-schema";
import type { Card } from "@/types/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { CardFormFields } from "./card-form-fields";

interface CardFormProps {
  deckId: string;
  card?: Card;
  onSuccess?: () => void;
}

export const CardForm = ({ deckId, card, onSuccess }: CardFormProps) => {
  const isEdit = Boolean(card);
  const { create, isPending: isCreating } = useCreateCard();
  const { update, isPending: isUpdating } = useUpdateCard();
  const isPending = isCreating || isUpdating;

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: cardToFormValues(card),
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  useEffect(() => {
    reset(cardToFormValues(card));
  }, [card, reset]);

  const onSubmit = async (values: CardFormValues) => {
    try {
      if (isEdit && card) {
        await update(formValuesToUpdatePayload(card.id, values));
      } else {
        await create(formValuesToCreatePayload(deckId, values));
        reset(getDefaultCardFormValues());
      }

      onSuccess?.();
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  };

  const title = isEdit ? "Edit flashcard" : "Create flashcard";
  const description = isEdit
    ? "Update the flashcard content and metadata."
    : "Add a new flashcard to this deck.";
  const submitLabel = isEdit ? "Save" : "Create";

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4 py-4"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-foreground">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <CardFormFields disableTypeSelect={isEdit} />

        <p
          className="text-sm text-red-500"
          role="alert"
          id="card-form-error"
          aria-atomic="true"
        >
          {errors.root?.message ?? ""}
        </p>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
