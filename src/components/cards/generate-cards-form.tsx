import { useGenerateCards } from "@/hooks/cards/use-generate-cards";
import { useListLlmModels } from "@/hooks/llm/use-list-llm-models";
import { getLlmProvider, getLlmProviderOptions } from "@/providers/llm-provider";
import {
  GenerateCardsSchema,
  generateCardsSchema,
} from "@/schemas/generate-cards-schema";
import { Deck } from "@/types/deck";
import { getErrorMessage } from "@/utils/handle-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Field } from "../shared/field";
import { Select } from "../shared/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ReviewCardsDialog } from "./review-cards-dialog";
import {
  DEFAULT_SYSTEM_PROMPT,
  LOCKED_RESPONSE_FORMAT_PROMPT,
} from "./generate-cards-constants";
import { useSettings } from "@/hooks/settings/use-settings";

interface GenerateCardsFormProps {
  deck: Deck;
}

export const GenerateCardsForm = ({ deck }: GenerateCardsFormProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
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
  const generatedCards = data ?? [];
  const errorMessage = getErrorMessage(error);
  const modelListErrorMessage = getErrorMessage(modelListQuery.error);

  const onSubmit = (data: GenerateCardsSchema) => {
    generateCards(
      {
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model,
        prompt: data.prompt,
        systemPrompt: `${data.systemPrompt}\n\n${LOCKED_RESPONSE_FORMAT_PROMPT}`,
      },
      { onSuccess: () => setIsReviewDialogOpen(true) }
    );
  };

  const isSubmitting = isGenerating;

  const generateButtonLabel = isGenerating ? "Generating..." : "Generate";

  return (
    <form
      className="w-full flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-medium text-foreground">
          Generate flashcards
        </h2>
        <p className="text-muted-foreground text-sm">
          Generate flashcards for your deck.
        </p>
      </div>

      <Field label="Provider" htmlFor="provider">
        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <Select
              className="w-full"
              id="provider"
              value={field.value}
              onChange={field.onChange}
              options={getLlmProviderOptions()}
            />
          )}
        />
      </Field>

      <Field label="Model" htmlFor="model" error={errors.model?.message}>
        <div className="flex gap-2">
          <Controller
            control={control}
            name="model"
            render={({ field }) => (
              <Select
                className="w-full"
                id="model"
                value={field.value}
                onChange={field.onChange}
                options={modelOptions}
                disabled={modelListQuery.isFetching}
              />
            )}
          />
          <Button
            type="button"
            variant="outline"
            disabled={modelListQuery.isFetching}
            onClick={() => void modelListQuery.refetch()}
          >
            {modelListQuery.isFetching ? "Loading..." : "Load models"}
          </Button>
        </div>
        {modelListErrorMessage && (
          <p className="text-sm text-red-500" role="alert">
            {modelListErrorMessage}
          </p>
        )}
      </Field>

      <Field label="API Key" htmlFor="api-key" error={errors.apiKey?.message}>
        <Input
          {...register("apiKey")}
          id="api-key"
          placeholder="Enter API key"
          className="w-full"
          type="password"
        />
      </Field>

      <Field
        label="System prompt"
        htmlFor="system-prompt"
        error={errors.systemPrompt?.message}
      >
        <Textarea
          id="system-prompt"
          placeholder="Enter system prompt"
          className="w-full max-h-[200px] overflow-y-auto"
          rows={15}
          {...register("systemPrompt")}
        />
      </Field>

      <Field label="Prompt" htmlFor="prompt" error={errors.prompt?.message}>
        <Textarea
          id="prompt"
          placeholder="Enter prompt"
          className="w-full max-h-[200px] overflow-y-auto"
          rows={10}
          {...register("prompt")}
        />
      </Field>

      {errorMessage && !isReviewDialogOpen && (
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

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {generateButtonLabel}
      </Button>

      {generatedCards.length > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setIsReviewDialogOpen(true)}
        >
          Review {generatedCards.length} generated cards
        </Button>
      )}

      <ReviewCardsDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        onSave={(count) => {
          setSavedCount(count);
          reset();
        }}
        cards={generatedCards}
        deck={deck}
      />
    </form>
  );
};
