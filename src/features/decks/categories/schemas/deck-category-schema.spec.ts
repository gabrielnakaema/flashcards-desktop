import { describe, expect, it } from "vitest";
import { deckCategorySchema } from "./deck-category-schema";

describe("deckCategorySchema", () => {
  describe("name", () => {
    it("accepts a non-empty name", () => {
      const result = deckCategorySchema.safeParse({ name: "Languages" });
      expect(result.success).toBe(true);
    });

    it("rejects an empty name", () => {
      const result = deckCategorySchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("name");
    });

    it("rejects a whitespace-only name", () => {
      const result = deckCategorySchema.safeParse({ name: "   " });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("name");
    });

    it("trims leading and trailing whitespace", () => {
      const result = deckCategorySchema.safeParse({ name: "  Math  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Math");
      }
    });
  });
});
