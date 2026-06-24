import { z } from "zod";

const tagsSchema = z
  .string()
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return;
    const tags = val.split(",").map((t) => t.trim());
    tags.forEach((tag, index) => {
      if (tag.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `Tag at position ${index + 1} is empty. Remove trailing or consecutive commas.`,
        });
      }
    });
  });

export const deckFormSchema = z.object({
  title: z.string().min(1),
  tags: tagsSchema,
  categoryId: z.string().min(1),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
