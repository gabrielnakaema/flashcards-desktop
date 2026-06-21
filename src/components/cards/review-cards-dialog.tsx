import { GeneratedCard } from "@/types/llm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cardFormSchema,
  CardFormValues,
  formValuesToCreatePayload,
} from "@/schemas/card-form-schema";
import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBulkCreateCards } from "@/hooks/cards/use-bulk-create-cards";
import { getErrorMessage } from "@/utils/handle-error";
import { Deck } from "@/types/deck";
import { Button } from "../ui/button";
import { CardFormFields } from "./card-form-fields";

interface ReviewCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (count: number) => void;
  cards: GeneratedCard[];
  deck: Deck;
}

interface GeneratedCardDraft {
  id: string;
  approved: boolean;
  values: CardFormValues;
}

const DRAFT_TYPE_LABELS = {
  plain: "Plain",
  multiple_choice: "Multiple choice",
  typed_answer: "Typed answer",
} satisfies Record<CardFormValues["type"], string>;

const generatedCardToFormValues = (card: GeneratedCard): CardFormValues => {
  const base: CardFormValues = {
    type: card.type,
    front: card.front,
    back: card.back ?? "",
    hint: card.hint ?? "",
    explanation: card.explanation ?? "",
    sourceExcerpt: card.sourceExcerpt ?? "",
    difficulty: card.difficulty ?? "",
    tags: card.tags?.join(", ") ?? "",
    choices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
    correctChoiceId: "",
    acceptedAnswer: "",
    aliases: "",
    caseSensitive: false,
  };

  if (card.type === "multiple_choice") {
    const content = card.content as {
      choices?: CardFormValues["choices"];
      correctChoiceId?: string;
    };

    return {
      ...base,
      choices: content.choices?.length ? content.choices : base.choices,
      correctChoiceId: content.correctChoiceId ?? "",
    };
  }

  if (card.type === "typed_answer") {
    const content = card.content as {
      acceptedAnswer?: string;
      aliases?: string[];
      caseSensitive?: boolean;
    };

    return {
      ...base,
      acceptedAnswer: content.acceptedAnswer ?? "",
      aliases: content.aliases?.join(", ") ?? "",
      caseSensitive: content.caseSensitive ?? false,
    };
  }

  return base;
};

const generatedCardToDraft = (
  card: GeneratedCard,
  index: number
): GeneratedCardDraft => ({
  id: `generated-card-${index}`,
  approved: true,
  values: generatedCardToFormValues(card),
});

const getDraftAnswerSummary = (values: CardFormValues): string => {
  if (values.type === "plain") {
    return values.back?.trim() || "No answer";
  }

  if (values.type === "multiple_choice") {
    const correctChoice = values.choices?.find(
      (choice) => choice.id === values.correctChoiceId
    );
    return correctChoice?.text.trim() || "No correct choice";
  }

  return values.acceptedAnswer?.trim() || "No accepted answer";
};

interface DraftCardEditFormProps {
  draft: GeneratedCardDraft;
  onCommit: (values: CardFormValues) => void;
  onBack: () => void;
}

const DraftCardEditForm = ({
  draft,
  onCommit,
  onBack,
}: DraftCardEditFormProps) => {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: draft.values,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Edit generated card
          </p>
          <p className="text-xs text-muted-foreground">
            {DRAFT_TYPE_LABELS[draft.values.type]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to table
          </Button>
          <Button type="button" onClick={form.handleSubmit(onCommit)}>
            Save
          </Button>
        </div>
      </div>

      <FormProvider {...form}>
        <CardFormFields disableTypeSelect />
      </FormProvider>
    </div>
  );
};

export const ReviewCardsDialog = ({
  open,
  onOpenChange,
  onSave,
  cards,
  deck,
}: ReviewCardsDialogProps) => {
  const [drafts, setDrafts] = useState<GeneratedCardDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    bulkCreate,
    isPending: isCreating,
    error: createError,
  } = useBulkCreateCards();

  const errorMessage = validationError ?? getErrorMessage(createError);

  useEffect(() => {
    setDrafts(cards.map(generatedCardToDraft));
  }, [cards]);

  const commitDraftValues = useCallback(
    (draftId: string, values: CardFormValues) => {
      setDrafts((current) =>
        current.map((d) => (d.id === draftId ? { ...d, values } : d))
      );
    },
    []
  );

  const toggleDraftApproval = (draftId: string, approved: boolean) => {
    setValidationError(null);
    setDrafts((current) =>
      current.map((d) => (d.id === draftId ? { ...d, approved } : d))
    );
  };

  const discardDraft = (draftId: string) => {
    setDrafts((current) => current.filter((d) => d.id !== draftId));
    if (editingDraftId === draftId) setEditingDraftId(null);
  };

  const selectAllDrafts = () => {
    setDrafts((current) => current.map((d) => ({ ...d, approved: true })));
  };

  const clearDraftSelection = () => {
    setDrafts((current) => current.map((d) => ({ ...d, approved: false })));
  };

  const discardSelectedDrafts = () => {
    const selectedIds = new Set(
      drafts.filter((d) => d.approved).map((d) => d.id)
    );

    if (selectedIds.size === 0) {
      setValidationError("Select at least one generated card to discard.");
      return;
    }

    setDrafts((current) => current.filter((d) => !selectedIds.has(d.id)));

    if (editingDraftId && selectedIds.has(editingDraftId)) {
      setEditingDraftId(null);
    }
  };

  const discardAllDrafts = () => {
    setDrafts([]);
    setEditingDraftId(null);
  };

  const handleSave = () => {
    const approvedDrafts = drafts.filter((d) => d.approved);

    if (approvedDrafts.length === 0) {
      setValidationError("Select at least one generated card before saving.");
      return;
    }

    const payloads = [];
    for (const [index, draft] of approvedDrafts.entries()) {
      const result = cardFormSchema.safeParse(draft.values);
      if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid card.";
        setValidationError(`Generated card ${index + 1}: ${message}`);
        return;
      }
      payloads.push(formValuesToCreatePayload(deck.id, result.data));
    }

    setValidationError(null);
    bulkCreate(payloads, {
      onSuccess: () => {
        setDrafts([]);
        setEditingDraftId(null);
        onSave?.(payloads.length);
        onOpenChange(false);
      },
    });
  };

  const selectedDraftCount = drafts.filter((d) => d.approved).length;
  const editingDraft = drafts.find((d) => d.id === editingDraftId) ?? null;
  const saveButtonLabel = isCreating ? "Saving..." : "Save selected cards";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Review generated cards</DialogTitle>
          <DialogDescription>
            Select the cards you want to save, discard low-quality drafts, or
            edit a single draft before saving.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="text-sm text-red-500" role="alert">
            {errorMessage}
          </p>
        )}

        {editingDraft ? (
          <DraftCardEditForm
            key={editingDraft.id}
            draft={editingDraft}
            onCommit={(values) => {
              commitDraftValues(editingDraft.id, values);
              setEditingDraftId(null);
            }}
            onBack={() => setEditingDraftId(null)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedDraftCount} of {drafts.length} drafts selected.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={selectAllDrafts}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearDraftSelection}
                >
                  Clear selection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={discardSelectedDrafts}
                >
                  Discard selected
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={discardAllDrafts}
                >
                  Discard all
                </Button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="w-12 px-3 py-2">Save</th>
                    <th className="w-36 px-3 py-2">Type</th>
                    <th className="px-3 py-2">Question</th>
                    <th className="px-3 py-2">Answer</th>
                    <th className="w-40 px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {drafts.map((draft, index) => (
                    <tr key={draft.id} className="align-top">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={draft.approved}
                          aria-label={`Select card ${index + 1} for save`}
                          onChange={(e) =>
                            toggleDraftApproval(draft.id, e.target.checked)
                          }
                          className="size-4 rounded border border-input"
                        />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {DRAFT_TYPE_LABELS[draft.values.type]}
                      </td>
                      <td className="max-w-[320px] px-3 py-3">
                        <p className="line-clamp-2">{draft.values.front}</p>
                      </td>
                      <td className="max-w-[320px] px-3 py-3">
                        <p className="line-clamp-2">
                          {getDraftAnswerSummary(draft.values)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDraftId(draft.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => discardDraft(draft.id)}
                          >
                            Discard
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!editingDraft && (
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isCreating}
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={isCreating}
              aria-busy={isCreating}
              onClick={handleSave}
            >
              {saveButtonLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
