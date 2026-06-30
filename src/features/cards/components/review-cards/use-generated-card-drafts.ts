import { useReducer } from "react";
import type { GeneratedCard } from "@/features/llm";
import type { CardFormValues } from "@/features/cards/schemas/card-form-schema";
import {
  doGeneratedCardsExtendPrevious,
  getGeneratedCardDraftId,
  reconcileGeneratedCardDrafts,
  type GeneratedCardDraft,
} from "./review-cards-panel.utils";

interface State {
  drafts: GeneratedCardDraft[];
  editingDraftId: string | null;
  validationError: string | null;
  previousCards: GeneratedCard[];
}

export type Action =
  | { type: "cardsReceived"; cards: GeneratedCard[] }
  | { type: "draftEdited"; draftId: string; values: CardFormValues }
  | { type: "draftApprovalToggled"; draftId: string; approved: boolean }
  | { type: "draftDiscarded"; draftId: string }
  | { type: "selectedDraftsDiscarded" }
  | { type: "allDraftsDiscarded" }
  | { type: "allDraftsSelected" }
  | { type: "selectionCleared" }
  | { type: "editingStarted"; draftId: string }
  | { type: "editingEnded" }
  | { type: "validationErrorSet"; message: string | null }
  | { type: "saveSucceeded" };

export const initialState: State = {
  drafts: [],
  editingDraftId: null,
  validationError: null,
  previousCards: [],
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "cardsReceived": {
      const { cards } = action;
      const extendsPrevious = doGeneratedCardsExtendPrevious(
        state.previousCards,
        cards
      );
      const nextDrafts = reconcileGeneratedCardDrafts(
        state.drafts,
        state.previousCards,
        cards
      );
      const nextEditingDraftId =
        extendsPrevious &&
        state.editingDraftId !== null &&
        cards.some((_, i) => getGeneratedCardDraftId(i) === state.editingDraftId)
          ? state.editingDraftId
          : null;

      return {
        ...state,
        drafts: nextDrafts,
        editingDraftId: nextEditingDraftId,
        validationError: extendsPrevious ? state.validationError : null,
        previousCards: cards,
      };
    }

    case "draftEdited":
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.draftId ? { ...d, values: action.values } : d
        ),
      };

    case "draftApprovalToggled":
      return {
        ...state,
        validationError: null,
        drafts: state.drafts.map((d) =>
          d.id === action.draftId ? { ...d, approved: action.approved } : d
        ),
      };

    case "draftDiscarded":
      return {
        ...state,
        drafts: state.drafts.filter((d) => d.id !== action.draftId),
        editingDraftId:
          state.editingDraftId === action.draftId ? null : state.editingDraftId,
      };

    case "selectedDraftsDiscarded": {
      const selectedIds = new Set(
        state.drafts.filter((d) => d.approved).map((d) => d.id)
      );

      if (selectedIds.size === 0) {
        return {
          ...state,
          validationError: "Select at least one generated card to discard.",
        };
      }

      return {
        ...state,
        drafts: state.drafts.filter((d) => !selectedIds.has(d.id)),
        editingDraftId:
          state.editingDraftId !== null &&
          selectedIds.has(state.editingDraftId)
            ? null
            : state.editingDraftId,
      };
    }

    case "allDraftsDiscarded":
      return { ...state, drafts: [], editingDraftId: null };

    case "allDraftsSelected":
      return {
        ...state,
        drafts: state.drafts.map((d) => ({ ...d, approved: true })),
      };

    case "selectionCleared":
      return {
        ...state,
        drafts: state.drafts.map((d) => ({ ...d, approved: false })),
      };

    case "editingStarted":
      return { ...state, editingDraftId: action.draftId };

    case "editingEnded":
      return { ...state, editingDraftId: null };

    case "validationErrorSet":
      return { ...state, validationError: action.message };

    case "saveSucceeded":
      return { ...state, drafts: [], editingDraftId: null, validationError: null };

    default:
      return state;
  }
};

export const useGeneratedCardDrafts = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    drafts: state.drafts,
    editingDraft:
      state.drafts.find((d) => d.id === state.editingDraftId) ?? null,
    selectedDraftCount: state.drafts.filter((d) => d.approved).length,
    hasDrafts: state.drafts.length > 0,
    validationError: state.validationError,
    dispatch,
  };
};
