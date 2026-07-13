import { describe, expect, it } from "vitest";
import { deckCategorySchema } from "./deck-category-schema";

describe("deckCategorySchema", () => {
  it("accepts and trims a category name", () => {
    expect(deckCategorySchema.parse({ name: "  Languages  " })).toEqual({
      name: "Languages",
    });
  });

  it("rejects blank category names", () => {
    const result = deckCategorySchema.safeParse({ name: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Name is required");
  });
});
