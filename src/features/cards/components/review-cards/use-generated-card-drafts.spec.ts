import { describe, expect, it } from "vitest";
import type { GeneratedCard } from "@/features/llm";
import type { CardFormValues } from "@/features/cards/schemas/card-form-schema";
import { initialState, reducer } from "./use-generated-card-drafts";
import type { GeneratedCardDraft } from "./review-cards-panel.utils";

const card1: GeneratedCard = { type: "plain", front: "Q1", back: "A1" };
const card2: GeneratedCard = { type: "plain", front: "Q2", back: "A2" };
const card3: GeneratedCard = { type: "plain", front: "Q3", back: "A3" };

const plainValues: CardFormValues = {
  type: "plain",
  front: "Q",
  back: "A",
  hint: "",
  explanation: "",
  sourceExcerpt: "",
  difficulty: "",
  tags: "",
  choices: [
    { id: "a", text: "" },
    { id: "b", text: "" },
  ],
  correctChoiceId: "",
  acceptedAnswer: "",
  aliases: "",
  caseSensitive: false,
};

const makeDraft = (
  id: string,
  overrides: Partial<GeneratedCardDraft> = {}
): GeneratedCardDraft => ({ id, approved: true, values: plainValues, ...overrides });

describe("useGeneratedCardDrafts reducer", () => {
  describe("cardsReceived", () => {
    it("creates approved drafts for each card from empty state", () => {
      const next = reducer(initialState, {
        type: "cardsReceived",
        cards: [card1, card2],
      });

      expect(next.drafts).toHaveLength(2);
      expect(next.drafts[0]).toMatchObject({ id: "generated-card-0", approved: true });
      expect(next.drafts[1]).toMatchObject({ id: "generated-card-1", approved: true });
    });

    it("appends new drafts and preserves edited existing ones when cards extend", () => {
      const afterFirst = reducer(initialState, { type: "cardsReceived", cards: [card1] });
      const edited = {
        ...afterFirst.drafts[0],
        approved: false,
        values: { ...afterFirst.drafts[0].values, front: "Edited" },
      };
      const withEdit = { ...afterFirst, drafts: [edited] };

      const next = reducer(withEdit, { type: "cardsReceived", cards: [card1, card2] });

      expect(next.drafts).toHaveLength(2);
      expect(next.drafts[0]).toBe(edited);
      expect(next.drafts[1]).toMatchObject({ id: "generated-card-1", approved: true });
    });

    it("rebuilds all drafts when incoming cards are not a prefix extension", () => {
      const afterFirst = reducer(initialState, { type: "cardsReceived", cards: [card1] });
      const edited = {
        ...afterFirst.drafts[0],
        values: { ...afterFirst.drafts[0].values, front: "Edited" },
      };

      const next = reducer(
        { ...afterFirst, drafts: [edited] },
        { type: "cardsReceived", cards: [card3] }
      );

      expect(next.drafts).toHaveLength(1);
      expect(next.drafts[0]).not.toBe(edited);
      expect(next.drafts[0]).toMatchObject({ id: "generated-card-0", approved: true });
      expect(next.drafts[0].values.front).toBe(card3.front);
    });

    it("preserves editingDraftId when the edited card still exists after extension", () => {
      const afterTwo = reducer(initialState, { type: "cardsReceived", cards: [card1, card2] });

      const next = reducer(
        { ...afterTwo, editingDraftId: "generated-card-0" },
        { type: "cardsReceived", cards: [card1, card2, card3] }
      );

      expect(next.editingDraftId).toBe("generated-card-0");
    });

    it("resets editingDraftId on non-prefix replacement", () => {
      const afterOne = reducer(initialState, { type: "cardsReceived", cards: [card1] });

      const next = reducer(
        { ...afterOne, editingDraftId: "generated-card-0" },
        { type: "cardsReceived", cards: [card2] }
      );

      expect(next.editingDraftId).toBeNull();
    });

    it("preserves validationError on extension", () => {
      const afterOne = reducer(initialState, { type: "cardsReceived", cards: [card1] });

      const next = reducer(
        { ...afterOne, validationError: "Some error" },
        { type: "cardsReceived", cards: [card1, card2] }
      );

      expect(next.validationError).toBe("Some error");
    });

    it("clears validationError on non-prefix replacement", () => {
      const afterOne = reducer(initialState, { type: "cardsReceived", cards: [card1] });

      const next = reducer(
        { ...afterOne, validationError: "Some error" },
        { type: "cardsReceived", cards: [card2] }
      );

      expect(next.validationError).toBeNull();
    });
  });

  describe("draftEdited", () => {
    it("updates values of the matching draft", () => {
      const state = { ...initialState, drafts: [makeDraft("d1"), makeDraft("d2")] };
      const updated = { ...plainValues, front: "New question" };

      const next = reducer(state, { type: "draftEdited", draftId: "d1", values: updated });

      expect(next.drafts[0].values.front).toBe("New question");
    });

    it("does not affect other drafts", () => {
      const state = { ...initialState, drafts: [makeDraft("d1"), makeDraft("d2")] };

      const next = reducer(state, {
        type: "draftEdited",
        draftId: "d1",
        values: { ...plainValues, front: "Changed" },
      });

      expect(next.drafts[1]).toBe(state.drafts[1]);
    });
  });

  describe("draftApprovalToggled", () => {
    it("sets approved to false", () => {
      const state = { ...initialState, drafts: [makeDraft("d1", { approved: true })] };

      const next = reducer(state, { type: "draftApprovalToggled", draftId: "d1", approved: false });

      expect(next.drafts[0].approved).toBe(false);
    });

    it("sets approved to true", () => {
      const state = { ...initialState, drafts: [makeDraft("d1", { approved: false })] };

      const next = reducer(state, { type: "draftApprovalToggled", draftId: "d1", approved: true });

      expect(next.drafts[0].approved).toBe(true);
    });

    it("clears validationError", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1")],
        validationError: "Stale error",
      };

      const next = reducer(state, { type: "draftApprovalToggled", draftId: "d1", approved: false });

      expect(next.validationError).toBeNull();
    });
  });

  describe("draftDiscarded", () => {
    it("removes the matching draft", () => {
      const state = { ...initialState, drafts: [makeDraft("d1"), makeDraft("d2")] };

      const next = reducer(state, { type: "draftDiscarded", draftId: "d1" });

      expect(next.drafts).toHaveLength(1);
      expect(next.drafts[0].id).toBe("d2");
    });

    it("clears editingDraftId when the discarded draft is being edited", () => {
      const state = { ...initialState, drafts: [makeDraft("d1")], editingDraftId: "d1" };

      const next = reducer(state, { type: "draftDiscarded", draftId: "d1" });

      expect(next.editingDraftId).toBeNull();
    });

    it("preserves editingDraftId when a different draft is discarded", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1"), makeDraft("d2")],
        editingDraftId: "d2",
      };

      const next = reducer(state, { type: "draftDiscarded", draftId: "d1" });

      expect(next.editingDraftId).toBe("d2");
    });
  });

  describe("selectedDraftsDiscarded", () => {
    it("removes all approved drafts", () => {
      const state = {
        ...initialState,
        drafts: [
          makeDraft("d1", { approved: true }),
          makeDraft("d2", { approved: false }),
          makeDraft("d3", { approved: true }),
        ],
      };

      const next = reducer(state, { type: "selectedDraftsDiscarded" });

      expect(next.drafts).toHaveLength(1);
      expect(next.drafts[0].id).toBe("d2");
    });

    it("sets validationError and leaves drafts intact when none are selected", () => {
      const state = { ...initialState, drafts: [makeDraft("d1", { approved: false })] };

      const next = reducer(state, { type: "selectedDraftsDiscarded" });

      expect(next.validationError).toBe("Select at least one generated card to discard.");
      expect(next.drafts).toHaveLength(1);
    });

    it("clears editingDraftId when the edited draft is among the discarded", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1", { approved: true })],
        editingDraftId: "d1",
      };

      const next = reducer(state, { type: "selectedDraftsDiscarded" });

      expect(next.editingDraftId).toBeNull();
    });

    it("preserves editingDraftId when the edited draft is not selected", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1", { approved: true }), makeDraft("d2", { approved: false })],
        editingDraftId: "d2",
      };

      const next = reducer(state, { type: "selectedDraftsDiscarded" });

      expect(next.editingDraftId).toBe("d2");
    });
  });

  describe("allDraftsDiscarded", () => {
    it("clears all drafts and editingDraftId", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1"), makeDraft("d2")],
        editingDraftId: "d1",
      };

      const next = reducer(state, { type: "allDraftsDiscarded" });

      expect(next.drafts).toHaveLength(0);
      expect(next.editingDraftId).toBeNull();
    });
  });

  describe("allDraftsSelected", () => {
    it("sets every draft to approved", () => {
      const state = {
        ...initialState,
        drafts: [
          makeDraft("d1", { approved: false }),
          makeDraft("d2", { approved: true }),
          makeDraft("d3", { approved: false }),
        ],
      };

      const next = reducer(state, { type: "allDraftsSelected" });

      expect(next.drafts.every((d) => d.approved)).toBe(true);
    });
  });

  describe("selectionCleared", () => {
    it("sets every draft to unapproved", () => {
      const state = {
        ...initialState,
        drafts: [
          makeDraft("d1", { approved: true }),
          makeDraft("d2", { approved: false }),
          makeDraft("d3", { approved: true }),
        ],
      };

      const next = reducer(state, { type: "selectionCleared" });

      expect(next.drafts.every((d) => !d.approved)).toBe(true);
    });
  });

  describe("editingStarted", () => {
    it("sets editingDraftId", () => {
      const next = reducer(
        { ...initialState, drafts: [makeDraft("d1")] },
        { type: "editingStarted", draftId: "d1" }
      );

      expect(next.editingDraftId).toBe("d1");
    });
  });

  describe("editingEnded", () => {
    it("clears editingDraftId", () => {
      const next = reducer(
        { ...initialState, editingDraftId: "d1" },
        { type: "editingEnded" }
      );

      expect(next.editingDraftId).toBeNull();
    });
  });

  describe("validationErrorSet", () => {
    it("sets the error message", () => {
      const next = reducer(initialState, {
        type: "validationErrorSet",
        message: "Required",
      });

      expect(next.validationError).toBe("Required");
    });

    it("clears the error when message is null", () => {
      const next = reducer(
        { ...initialState, validationError: "Old error" },
        { type: "validationErrorSet", message: null }
      );

      expect(next.validationError).toBeNull();
    });
  });

  describe("saveSucceeded", () => {
    it("clears drafts, editingDraftId, and validationError", () => {
      const state = {
        ...initialState,
        drafts: [makeDraft("d1"), makeDraft("d2")],
        editingDraftId: "d1",
        validationError: "Some error",
      };

      const next = reducer(state, { type: "saveSucceeded" });

      expect(next.drafts).toHaveLength(0);
      expect(next.editingDraftId).toBeNull();
      expect(next.validationError).toBeNull();
    });
  });
});
