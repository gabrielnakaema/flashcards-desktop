import { describe, expect, it } from "vitest";
import { deckFormSchema } from "./deck-form.schema";

describe("deckFormSchema", () => {
  describe("title", () => {
    it("accepts a non-empty title", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty title", () => {
      const result = deckFormSchema.safeParse({
        title: "",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("title");
    });
  });

  describe("categoryId", () => {
    it("accepts a non-empty categoryId", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        categoryId: "cat-42",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty categoryId", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        categoryId: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toContain("categoryId");
    });
  });

  describe("tags", () => {
    it("is optional — passes when tags is omitted", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts an empty string for tags", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: "",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a single tag", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: "math",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts multiple comma-separated tags", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: "math, science, history",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a trailing comma", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: "math,",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 2 is empty/i
      );
    });

    it("rejects a leading comma", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: ",math",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 1 is empty/i
      );
    });

    it("rejects consecutive commas", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: "math,,science",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 2 is empty/i
      );
    });

    it("reports errors for every empty tag position", () => {
      const result = deckFormSchema.safeParse({
        title: "My Deck",
        tags: ",,",
        categoryId: "cat-1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBe(3);
    });
  });
});
