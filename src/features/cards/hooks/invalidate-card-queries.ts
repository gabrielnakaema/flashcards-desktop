import type { QueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "@/features/decks";
import { cardsQueryKeys } from "./cards-query-keys";

export const invalidateCardQueries = (queryClient: QueryClient): Promise<void> =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: cardsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: decksQueryKeys.all }),
  ]).then(() => undefined);
