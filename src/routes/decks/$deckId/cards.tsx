import { DeckCardsContent } from "@/components/cards/deck-cards-content";
import {
  DEFAULT_CARD_LIST_FILTERS,
  type CardListFilters,
  normalizeCardListFilters,
} from "@/components/cards/card-list-filters";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const cardsRouteSearchSchema = z.object({
  search: z.string().optional().catch(undefined),
  type: z
    .enum(["all", "plain", "multiple_choice", "typed_answer"])
    .optional()
    .catch(undefined),
  difficulty: z.enum(["all", "easy", "medium", "hard"]).optional().catch(undefined),
});

type CardsRouteSearch = z.infer<typeof cardsRouteSearchSchema>;

export const Route = createFileRoute("/decks/$deckId/cards")({
  validateSearch: (search): CardsRouteSearch =>
    cardsRouteSearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const { deckId } = Route.useParams();
  const navigate = Route.useNavigate();
  const cardFilters = normalizeCardListFilters(Route.useSearch());

  const handleCardFiltersChange = (filters: Partial<CardListFilters>) => {
    const nextFilters = normalizeCardListFilters({
      ...cardFilters,
      ...filters,
    });

    void navigate({
      replace: true,
      search: {
        search: nextFilters.search || undefined,
        type:
          nextFilters.type === DEFAULT_CARD_LIST_FILTERS.type
            ? undefined
            : nextFilters.type,
        difficulty:
          nextFilters.difficulty === DEFAULT_CARD_LIST_FILTERS.difficulty
            ? undefined
            : nextFilters.difficulty,
      },
    });
  };

  return (
    <DeckCardsContent
      deckId={deckId}
      cardFilters={cardFilters}
      onCardFiltersChange={handleCardFiltersChange}
    />
  );
}
