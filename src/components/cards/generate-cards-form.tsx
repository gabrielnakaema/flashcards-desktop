import { Deck } from "@/types/deck";
import { Field } from "../shared/field";
import { Textarea } from "../ui/textarea";
import { Controller, useForm } from "react-hook-form";
import {
  GenerateCardsSchema,
  generateCardsSchema,
} from "@/schemas/generate-cards-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "../shared/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface GenerateCardsFormProps {
  deck: Deck;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that generates flashcards for a given topic.
You will be given a topic in a prompt and you will need to generate flashcards for it.
Your response should exclusively be a JSON Array of objects, with each object having the following TypeScript Schema:

interface CreateFlashcardItem {
  type: "plain" | "multiple_choice" | "typed_answer";
  front: string;
  back?: string;
  content?: Record<string, unknown>;
  hint?: string;
  explanation?: string;
  sourceExcerpt?: string;
  difficulty?: string;
  tags?: string[];
}

`;

export const GenerateCardsForm = ({ deck }: GenerateCardsFormProps) => {
  const { register, control, handleSubmit } = useForm<GenerateCardsSchema>({
    resolver: zodResolver(generateCardsSchema),
    defaultValues: {
      provider: "openai",
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      prompt: `Generate 10 flashcards for the topic: ${deck.title}`,
      apiKey: "",
    },
  });

  const onSubmit = (data: GenerateCardsSchema) => {
    console.log(data);
  };

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
              options={[{ label: "OpenAI", value: "openai" }]}
            />
          )}
        />
      </Field>

      <Field label="API Key" htmlFor="prompt">
        <Input
          {...register("apiKey")}
          id="api-key"
          placeholder="Enter API key"
          className="w-full"
          type="password"
        />
      </Field>

      <Field label="System prompt" htmlFor="system-prompt">
        <Textarea
          id="system-prompt"
          placeholder="Enter system prompt"
          className="w-full"
          rows={15}
          {...register("systemPrompt")}
        />
      </Field>

      <Field label="Prompt" htmlFor="prompt">
        <Textarea
          id="prompt"
          placeholder="Enter prompt"
          className="w-full"
          rows={10}
          {...register("prompt")}
        />
      </Field>

      <Button type="submit" className="w-full">
        Generate
      </Button>
    </form>
  );
};
