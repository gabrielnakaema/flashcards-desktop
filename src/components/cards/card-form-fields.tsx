import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/shared/select";
import { Textarea } from "@/components/ui/textarea";
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
    <>
      <Controller
        control={control}
        name="type"
        render={({ field, fieldState: { error } }) => (
          <Field label="Type" htmlFor="card-type" error={error?.message}>
            <Select
              value={field.value}
              onChange={field.onChange}
              disabled={disableTypeSelect}
              options={CARD_TYPE_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
              className="w-full"
              id="card-type"
            />
          </Field>
        )}
      />

      <Field label="Front" htmlFor="card-front" error={errors.front?.message}>
        <Textarea
          {...register("front")}
          id="card-front"
          placeholder="Question or prompt"
          className="w-full"
          rows={4}
        />
      </Field>

      {cardType === "plain" && (
        <Field label="Back" htmlFor="card-back" error={errors.back?.message}>
          <Textarea
            {...register("back")}
            id="card-back"
            placeholder="Answer"
            className="w-full"
            rows={4}
          />
        </Field>
      )}

      {cardType === "multiple_choice" && (
        <>
          <Field
            label="Choices"
            htmlFor="card-choice-0"
            error={errors.choices?.message ?? errors.choices?.root?.message}
          >
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">
                    {choices[index]?.id ?? field.id}
                  </span>
                  <Input
                    {...register(`choices.${index}.text`)}
                    id={`card-choice-${index}`}
                    placeholder={`Choice ${index + 1}`}
                    className="w-full"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={fields.length <= 2}
                    onClick={() => remove(index)}
                    aria-label={`Remove choice ${index + 1}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => append({ id: nextChoiceId(choices), text: "" })}
              >
                <PlusIcon className="size-4" />
                Add choice
              </Button>
            </div>
          </Field>

          <Controller
            control={control}
            name="correctChoiceId"
            render={({ field, fieldState: { error } }) => (
              <Field
                label="Correct choice"
                htmlFor="card-correct-choice"
                error={error?.message}
              >
                <Select
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={choices
                    .filter((c) => c.text.trim())
                    .map((c) => ({
                      label: c.id.toUpperCase() + ": " + c.text,
                      value: c.id,
                    }))}
                  className="w-full"
                  id="card-correct-choice"
                />
              </Field>
            )}
          />
        </>
      )}

      {cardType === "typed_answer" && (
        <>
          <Field
            label="Accepted answer"
            htmlFor="card-accepted-answer"
            error={errors.acceptedAnswer?.message}
          >
            <Input
              {...register("acceptedAnswer")}
              id="card-accepted-answer"
              placeholder="Primary accepted answer"
              className="w-full"
            />
          </Field>

          <Field
            label="Aliases"
            htmlFor="card-aliases"
            error={errors.aliases?.message}
          >
            <Input
              {...register("aliases")}
              id="card-aliases"
              placeholder="e.g. sqlite, SQLite database"
              className="w-full"
            />
          </Field>

          <Field label="Matching" htmlFor="card-case-sensitive">
            <label className="flex items-center gap-2 text-sm">
              <input
                {...register("caseSensitive")}
                id="card-case-sensitive"
                type="checkbox"
                className="size-4 rounded border border-input"
              />
              Case sensitive matching
            </label>
          </Field>
        </>
      )}

      <Field label="Hint" htmlFor="card-hint" error={errors.hint?.message}>
        <Input
          {...register("hint")}
          id="card-hint"
          placeholder="Optional hint shown during review"
          className="w-full"
        />
      </Field>

      <Field
        label="Explanation"
        htmlFor="card-explanation"
        error={errors.explanation?.message}
      >
        <Textarea
          {...register("explanation")}
          id="card-explanation"
          placeholder="Optional explanation shown after answering"
          className="w-full"
          rows={3}
        />
      </Field>

      <Field
        label="Source excerpt"
        htmlFor="card-source-excerpt"
        error={errors.sourceExcerpt?.message}
      >
        <Textarea
          {...register("sourceExcerpt")}
          id="card-source-excerpt"
          placeholder="Optional source text this card was derived from"
          className="w-full"
          rows={3}
        />
      </Field>

      <Controller
        control={control}
        name="difficulty"
        render={({ field, fieldState: { error } }) => (
          <Field
            label="Difficulty"
            htmlFor="card-difficulty"
            error={error?.message}
          >
            <Select
              value={field.value ?? ""}
              onChange={field.onChange}
              options={DIFFICULTY_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
              className="w-full"
              id="card-difficulty"
            />
          </Field>
        )}
      />

      <Field label="Tags" htmlFor="card-tags" error={errors.tags?.message}>
        <Input
          {...register("tags")}
          id="card-tags"
          placeholder="e.g. vocabulary, chapter-1"
          className="w-full"
        />
      </Field>
    </>
  );
};
