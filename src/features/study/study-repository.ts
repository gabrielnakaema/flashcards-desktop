import type {
  CardWithSchedule,
  ReviewLog,
  SubmitReviewPayload,
} from "@/features/cards/types";

export interface StudyRepository {
  getDueCards: (deckId: string) => Promise<CardWithSchedule[]>;
  submitReview: (payload: SubmitReviewPayload) => Promise<ReviewLog>;
  resetDeckStudyProgress: (deckId: string) => Promise<void>;
}
