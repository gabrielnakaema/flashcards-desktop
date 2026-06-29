import { AppInput } from "@/shared/components/app-input";
import { AppButton } from "@/shared/components/app-button";
import { AppSelect } from "@/shared/components/app-select";
import { AppTextarea } from "@/shared/components/app-textarea";
import { useGenerateCards } from "@/features/cards/hooks/use-generate-cards";
import { useDeckDetails } from "@/features/decks";
import { useListLlmModels } from "@/features/llm";
import { useSettings } from "@/features/settings";
import {
  getLlmProvider,
  getLlmProviderOptions,
} from "@/features/llm";
import {
  GenerateCardsSchema,
  generateCardsSchema,
} from "@/features/cards/schemas/generate-cards-schema";
import type { Deck } from "@/features/decks";
import { getErrorMessage } from "@/shared/utils/handle-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  DEFAULT_SYSTEM_PROMPT,
  LOCKED_RESPONSE_FORMAT_PROMPT,
} from "./generate-cards-constants";
import { ReviewCardsPanel } from "../review-cards/review-cards-panel";

interface DeckGenerateCardsContentProps {
  deckId: string;
}

interface DeckGenerateCardsFormProps {
  deck: Deck;
  deckId: string;
}

const DeckGenerateCardsForm = ({
  deck,
  deckId,
}: DeckGenerateCardsFormProps) => {
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const { data: settings } = useSettings();
  const defaultProvider = settings.defaultProvider;
  const defaultModel =
    settings.defaultModel ?? getLlmProvider(defaultProvider).defaultModel;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateCardsSchema>({
    resolver: zodResolver(generateCardsSchema),
    defaultValues: {
      provider: defaultProvider,
      model: defaultModel,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      prompt: `Generate 10 flashcards for the topic: ${deck.title}`,
      apiKey: settings.apiKey ?? "",
    },
  });

  const provider = useWatch({ control, name: "provider" });
  const model = useWatch({ control, name: "model" });
  const apiKey = useWatch({ control, name: "apiKey" });
  const providerLabel = getLlmProvider(provider).label;

  const modelListQuery = useListLlmModels({
    provider,
    apiKey,
    enabled: true,
  });
  const modelOptions = modelListQuery.data ?? [
    { label: model || defaultModel, value: model || defaultModel },
  ];

  const {
    mutate: generateCards,
    isPending: isGenerating,
    data,
    error,
    reset,
  } = useGenerateCards();

  const generatedCards = data;
  const errorMessage = getErrorMessage(error);
  const modelListErrorMessage = getErrorMessage(modelListQuery.error);

  const onSubmit = (formData: GenerateCardsSchema) => {
    generateCards({
      provider: formData.provider,
      apiKey: formData.apiKey,
      model: formData.model,
      prompt: formData.prompt,
      systemPrompt: `${formData.systemPrompt}\n\n${LOCKED_RESPONSE_FORMAT_PROMPT}`,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/decks/$deckId/cards"
            params={{ deckId }}
            className="flex shrink-0 items-center gap-1 text-xs font-mono tracking-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            back
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              Generate Studio
            </h1>
          </div>
        </div>

        <p className="shrink-0 text-xs font-mono text-muted-foreground">
          {model} • {providerLabel}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-120 shrink-0 flex-col border-r border-border bg-zinc-950">
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
              <AppTextarea
                id="prompt"
                label="Source / Topic"
                rows={5}
                placeholder="Paste study material or describe what to generate"
                className="min-h-28"
                error={errors.prompt?.message}
                {...register("prompt")}
              />

              <AppInput
                id="target-deck"
                label="Target Deck"
                value={deck.title}
                readOnly
                aria-readonly="true"
                className="cursor-default text-muted-foreground"
              />

              <Controller
                control={control}
                name="provider"
                render={({ field }) => (
                  <AppSelect
                    id="provider"
                    label="Provider"
                    value={field.value}
                    onChange={field.onChange}
                    options={getLlmProviderOptions()}
                  />
                )}
              />

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="model"
                  className="text-[11px] font-mono tracking-wide text-muted-foreground uppercase"
                >
                  Model
                </label>
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="model"
                    render={({ field }) => (
                      <AppSelect
                        id="model"
                        value={field.value}
                        onChange={field.onChange}
                        options={modelOptions}
                        disabled={modelListQuery.isFetching}
                        className="min-w-0 flex-1"
                      />
                    )}
                  />
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={modelListQuery.isFetching}
                    onClick={() => void modelListQuery.refetch()}
                  >
                    {modelListQuery.isFetching ? "..." : "Load"}
                  </AppButton>
                </div>
                {errors.model?.message && (
                  <p className="text-xs text-red-500">{errors.model.message}</p>
                )}
                {modelListErrorMessage && (
                  <p className="text-xs text-red-500" role="alert">
                    {modelListErrorMessage}
                  </p>
                )}
              </div>

              <AppInput
                {...register("apiKey")}
                id="api-key"
                label="API Key"
                type="password"
                placeholder="Enter API key"
                autoComplete="off"
                error={errors.apiKey?.message}
              />

              <AppTextarea
                id="system-prompt"
                label="System Prompt"
                rows={8}
                placeholder="Enter system prompt"
                className="min-h-40"
                error={errors.systemPrompt?.message}
                {...register("systemPrompt")}
              />

              {errorMessage && (
                <p className="text-sm text-red-500" role="alert">
                  {errorMessage}
                </p>
              )}

              {savedCount !== null ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Saved {savedCount} flashcards.
                </p>
              ) : generatedCards.length > 0 ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Generated {generatedCards.length} flashcards.
                </p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border p-6">
              <AppButton
                type="submit"
                size="lg"
                disabled={isGenerating}
                aria-busy={isGenerating}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "+ Generate cards"}
              </AppButton>
            </div>
          </form>
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden">
          <ReviewCardsPanel
            cards={generatedCards}
            deck={deck}
            isGenerating={isGenerating}
            onSave={(count) => {
              setSavedCount(count);
              reset();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const DeckGenerateCardsContent = ({
  deckId,
}: DeckGenerateCardsContentProps) => {
  const { data: deck, isFetching, isError } = useDeckDetails(deckId);

  if (isFetching) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !deck) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-zinc-950 px-6">
        <p className="text-sm font-mono text-red-500">Failed to load deck.</p>
      </div>
    );
  }

  return <DeckGenerateCardsForm deck={deck} deckId={deckId} />;
};
