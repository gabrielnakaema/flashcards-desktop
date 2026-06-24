import { AppInput } from "@/components/shared/app-input";
import { AppSelect } from "@/components/shared/app-select";
import { AppTextarea } from "@/components/shared/app-textarea";
import { cn } from "@/lib/utils";
import { nextChoiceId, type CardFormValues } from "@/schemas/card-form-schema";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

export const CARD_TYPE_OPTIONS = [
  { value: "plain", label: "Plain (front/back)" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "typed_answer", label: "Typed answer" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

const FIELD_LABEL_CLASS =
  "text-[11px] font-mono tracking-wide text-muted-foreground uppercase";

const SECONDARY_BUTTON_CLASS =
  "rounded-sm border border-border bg-zinc-950 px-3 py-2 text-xs font-medium tracking-tight text-muted-foreground transition-colors hover:bg-zinc-900 hover:text-foreground font-mono disabled:cursor-not-allowed disabled:opacity-50";

interface CardFormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const CardFormField = ({
  label,
  htmlFor,
  error,
  children,
  className,
}: CardFormFieldProps) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <label htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
      {label}
    </label>
    {children}
    {error && (
      <p id={`${htmlFor}-error`} className="text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

interface CardFormFieldsProps {
  disableTypeSelect?: boolean;
}

export const CardFormFields = ({
  disableTypeSelect = false,
}: CardFormFieldsProps) => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<CardFormValues>();

  const cardType = watch("type");
  const choices = watch("choices") ?? [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: "choices",
  });

  return (
    <div className="flex flex-col gap-5">
      <Controller
        control={control}
        name="type"
        render={({ field, fieldState: { error } }) => (
          <AppSelect
            id="card-type"
            label="Type"
            value={field.value}
            onChange={field.onChange}
            disabled={disableTypeSelect}
            options={CARD_TYPE_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            aria-label="Type"
            error={error?.message}
          />
        )}
      />

      <AppTextarea
        {...register("front")}
        id="card-front"
        label="Front"
        placeholder="Question or prompt"
        rows={4}
        error={errors.front?.message}
      />

      {cardType === "plain" && (
        <AppTextarea
          {...register("back")}
          id="card-back"
          label="Back"
          placeholder="Answer"
          rows={4}
          error={errors.back?.message}
        />
      )}

      {cardType === "multiple_choice" && (
        <>
          <CardFormField
            label="Choices"
            htmlFor="card-choice-0"
            error={errors.choices?.message ?? errors.choices?.root?.message}
          >
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="w-6 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {choices[index]?.id ?? field.id}
                  </span>
                  <AppInput
                    {...register(`choices.${index}.text`)}
                    id={`card-choice-${index}`}
                    placeholder={`Choice ${index + 1}`}
                  />
                  <button
                    type="button"
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                    aria-label={`Remove choice ${index + 1}`}
                    className={cn(
                      SECONDARY_BUTTON_CLASS,
                      "inline-flex size-10 shrink-0 items-center justify-center p-0"
                    )}
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ id: nextChoiceId(choices), text: "" })}
                className={cn(
                  SECONDARY_BUTTON_CLASS,
                  "inline-flex w-fit items-center gap-2"
                )}
              >
                <PlusIcon className="size-4" />
                Add choice
              </button>
            </div>
          </CardFormField>

          <Controller
            control={control}
            name="correctChoiceId"
            render={({ field, fieldState: { error } }) => (
              <AppSelect
                id="card-correct-choice"
                label="Correct choice"
                value={field.value ?? ""}
                onChange={field.onChange}
                options={choices
                  .filter((choice) => choice.text.trim())
                  .map((choice) => ({
                    label: choice.id.toUpperCase() + ": " + choice.text,
                    value: choice.id,
                  }))}
                aria-label="Correct choice"
                error={error?.message}
              />
            )}
          />
        </>
      )}

      {cardType === "typed_answer" && (
        <>
          <AppInput
            {...register("acceptedAnswer")}
            id="card-accepted-answer"
            label="Accepted answer"
            placeholder="Primary accepted answer"
            error={errors.acceptedAnswer?.message}
          />

          <AppInput
            {...register("aliases")}
            id="card-aliases"
            label="Aliases"
            placeholder="e.g. sqlite, SQLite database"
            error={errors.aliases?.message}
          />

          <CardFormField label="Matching" htmlFor="card-case-sensitive">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                {...register("caseSensitive")}
                id="card-case-sensitive"
                type="checkbox"
                className="size-4 rounded-sm border border-input bg-zinc-900"
              />
              Case sensitive matching
            </label>
          </CardFormField>
        </>
      )}

      <AppInput
        {...register("hint")}
        id="card-hint"
        label="Hint"
        placeholder="Optional hint shown during review"
        error={errors.hint?.message}
      />

      <AppTextarea
        {...register("explanation")}
        id="card-explanation"
        label="Explanation"
        placeholder="Optional explanation shown after answering"
        rows={3}
        className="min-h-24"
        error={errors.explanation?.message}
      />

      <AppTextarea
        {...register("sourceExcerpt")}
        id="card-source-excerpt"
          label="Source excerpt"
        placeholder="Optional source text this card was derived from"
        rows={3}
        className="min-h-24"
        error={errors.sourceExcerpt?.message}
      />

      <Controller
        control={control}
        name="difficulty"
        render={({ field, fieldState: { error } }) => (
          <AppSelect
            id="card-difficulty"
            label="Difficulty"
            value={field.value ?? ""}
            onChange={field.onChange}
            options={DIFFICULTY_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            aria-label="Difficulty"
            error={error?.message}
          />
        )}
      />

      <AppInput
        {...register("tags")}
        id="card-tags"
        label="Tags"
        placeholder="e.g. vocabulary, chapter-1"
        error={errors.tags?.message}
      />
    </div>
  );
};
