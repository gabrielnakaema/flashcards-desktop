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
import { AppButton } from "@/components/shared/app-button";

interface CardFormProps {
  deckId: string;
  card?: Card;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CardForm = ({
  deckId,
  card,
  onSuccess,
  onCancel,
}: CardFormProps) => {
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
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <CardFormFields disableTypeSelect={isEdit} />

            {errors.root?.message && (
              <p
                className="mt-4 text-sm text-red-500"
                role="alert"
                id="card-form-error"
                aria-atomic="true"
              >
                {errors.root.message}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-6">
            {onCancel && (
              <AppButton
                type="button"
                variant="secondary"
                onClick={onCancel}
              >
                Cancel
              </AppButton>
            )}
            <AppButton
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="min-w-24"
            >
              {isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                submitLabel
              )}
            </AppButton>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
