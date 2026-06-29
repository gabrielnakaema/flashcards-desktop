import { cn } from "@/shared/lib/utils";
import { AppButton } from "@/shared/components/app-button";
import type { GeneratedCard } from "@/features/llm";
import {
  cardFormSchema,
  CardFormValues,
  formValuesToCreatePayload,
} from "@/features/cards/schemas/card-form-schema";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBulkCreateCards } from "@/features/cards/hooks/use-bulk-create-cards";
import { getErrorMessage } from "@/shared/utils/handle-error";
import { Deck } from "@/features/decks";
import { Loader2, Sparkles } from "lucide-react";
import { CardFormFields } from "../card-form/card-form-fields";
import {
  doGeneratedCardsExtendPrevious,
  getGeneratedCardDraftId,
  reconcileGeneratedCardDrafts,
  type GeneratedCardDraft,
} from "./review-cards-panel.utils";
import "./review-cards-motion.css";
import { toast } from "sonner";

interface ReviewCardsPanelProps {
  cards: GeneratedCard[];
  deck: Deck;
  onSave?: (count: number) => void;
  isGenerating?: boolean;
}

const destructiveButtonClassNames =
  "rounded-sm border border-red-500/30 bg-red-500/10 font-mono text-xs font-medium tracking-tight text-red-500 transition-colors hover:bg-red-500/15";

const DRAFT_TYPE_LABELS = {
  plain: "Plain",
  multiple_choice: "Multiple choice",
  typed_answer: "Typed answer",
} satisfies Record<CardFormValues["type"], string>;

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
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {DRAFT_TYPE_LABELS[draft.values.type]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onBack}
          >
            Back to table
          </AppButton>
          <AppButton
            type="button"
            size="sm"
            onClick={form.handleSubmit(onCommit)}
          >
            Save
          </AppButton>
        </div>
      </div>

      <FormProvider {...form}>
        <CardFormFields disableTypeSelect />
      </FormProvider>
    </div>
  );
};

export const ReviewCardsPanel = ({
  cards,
  deck,
  onSave,
  isGenerating = false,
}: ReviewCardsPanelProps) => {
  const [drafts, setDrafts] = useState<GeneratedCardDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const previousCardsRef = useRef<GeneratedCard[]>([]);

  const {
    bulkCreate,
    isPending: isCreating,
    error: createError,
  } = useBulkCreateCards();

  const errorMessage = validationError ?? getErrorMessage(createError);

  useEffect(() => {
    const previousCards = previousCardsRef.current;
    const extendsPreviousCards = doGeneratedCardsExtendPrevious(
      previousCards,
      cards
    );

    setDrafts((current) =>
      reconcileGeneratedCardDrafts(current, previousCards, cards)
    );
    setEditingDraftId((current) =>
      extendsPreviousCards &&
      current &&
      cards.some((_, index) => getGeneratedCardDraftId(index) === current)
        ? current
        : null
    );
    if (!extendsPreviousCards) {
      setValidationError(null);
    }
    previousCardsRef.current = cards;
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
        toast.success(`Saved ${payloads.length} cards successfully!`);
      },
    });
  };

  const selectedDraftCount = drafts.filter((d) => d.approved).length;
  const editingDraft = drafts.find((d) => d.id === editingDraftId) ?? null;
  const hasDrafts = drafts.length > 0;

  const renderContent = () => {
    if (editingDraft) {
      return (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DraftCardEditForm
            key={editingDraft.id}
            draft={editingDraft}
            onCommit={(values) => {
              commitDraftValues(editingDraft.id, values);
              setEditingDraftId(null);
            }}
            onBack={() => setEditingDraftId(null)}
          />
        </div>
      );
    }

    if (!hasDrafts && !isGenerating) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Sparkles className="size-5 text-muted-foreground/70" />
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Configure prompt, then generate
            </p>
            <p className="max-w-xs text-xs text-muted-foreground/80">
              Cards stream in as they're created
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedDraftCount} of {drafts.length} drafts selected.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <AppButton
                type="button"
                variant="secondary"
                size="xs"
                onClick={selectAllDrafts}
              >
                Select all
              </AppButton>
              <AppButton
                type="button"
                variant="secondary"
                size="xs"
                onClick={clearDraftSelection}
              >
                Clear selection
              </AppButton>
              <AppButton
                type="button"
                variant="secondary"
                size="xs"
                onClick={discardSelectedDrafts}
              >
                Discard selected
              </AppButton>
              <button
                type="button"
                onClick={discardAllDrafts}
                className={cn(destructiveButtonClassNames, "px-3 py-1.5")}
              >
                Discard all
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-sm border border-border/60 bg-zinc-950">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 bg-zinc-950 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-12 px-3 py-2">Save</th>
                  <th className="w-28 px-3 py-2">Type</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Answer</th>
                  <th className="w-36 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {drafts.map((draft, index) => (
                  <tr key={draft.id} className="generated-card-enter align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={draft.approved}
                        aria-label={`Select card ${index + 1} for save`}
                        onChange={(event) =>
                          toggleDraftApproval(draft.id, event.target.checked)
                        }
                        className="size-4 rounded-sm border border-input bg-muted"
                      />
                    </td>
                    <td className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {DRAFT_TYPE_LABELS[draft.values.type]}
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="line-clamp-2 text-foreground">
                        {draft.values.front}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="line-clamp-2 text-muted-foreground">
                        {getDraftAnswerSummary(draft.values)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <AppButton
                          type="button"
                          variant="secondary"
                          size="xs"
                          className="bg-muted px-2.5 py-1 text-foreground hover:bg-zinc-800"
                          onClick={() => setEditingDraftId(draft.id)}
                        >
                          Edit
                        </AppButton>
                        <button
                          type="button"
                          onClick={() => discardDraft(draft.id)}
                          className={cn(
                            destructiveButtonClassNames,
                            "px-2.5 py-1"
                          )}
                        >
                          Discard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {isGenerating && (
                  <tr className="generated-card-loading">
                    <td colSpan={5} className="px-3 py-4">
                      <div
                        className="flex flex-col gap-3"
                        role="status"
                        aria-live="polite"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="generated-card-loading-icon flex size-8 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-primary/5 text-primary">
                              <Sparkles className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-foreground">
                                Composing card {drafts.length + 1}
                              </p>
                              <p className="truncate text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                Waiting for the next complete draft
                              </p>
                            </div>
                          </div>
                          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        </div>

                        <div
                          className="generated-card-progress h-1 overflow-hidden rounded-full bg-white/5"
                          role="progressbar"
                          aria-label={`Generating card ${drafts.length + 1}`}
                        >
                          <span className="generated-card-progress-beam block h-full w-1/3 rounded-full bg-primary" />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-auto flex justify-end border-t border-border/60 pt-4">
          <AppButton
            type="button"
            disabled={isCreating || isGenerating}
            aria-busy={isCreating || isGenerating}
            onClick={handleSave}
          >
            {isCreating ? "Saving..." : "Save selected cards"}
          </AppButton>
        </div>
      </>
    );
  };

  return (
    <section
      aria-label="Generated cards preview"
      aria-labelledby={
        hasDrafts || isGenerating ? "review-generated-cards-heading" : undefined
      }
      className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-zinc-950 p-6"
    >
      {(hasDrafts || isGenerating) && (
        <header className="shrink-0 border-b border-border/60 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="review-generated-cards-heading"
              className="text-xs font-mono uppercase tracking-widest text-muted-foreground"
            >
              Generated drafts
            </h2>
            {isGenerating && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-primary">
                <Loader2 className="size-3 animate-spin" />
                Streaming
              </span>
            )}
          </div>
        </header>
      )}

      {errorMessage && (
        <p className="text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}

      {renderContent()}
    </section>
  );
};
