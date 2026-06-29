import { AppInput } from "@/shared/components/app-input";
import { AppSelect } from "@/shared/components/app-select";
import { AppTextarea } from "@/shared/components/app-textarea";
import { AppButton } from "@/shared/components/app-button";
import { cn } from "@/shared/lib/utils";
import {
  nextChoiceId,
  type CardFormValues,
} from "@/features/cards/schemas/card-form-schema";
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
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                    aria-label={`Remove choice ${index + 1}`}
                    className="size-10 p-0"
                  >
                    <Trash2Icon className="size-4" />
                  </AppButton>
                </div>
              ))}
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ id: nextChoiceId(choices), text: "" })}
                className="w-fit gap-2"
              >
                <PlusIcon className="size-4" />
                Add choice
              </AppButton>
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
                className="size-4 rounded-sm border border-input bg-muted"
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
