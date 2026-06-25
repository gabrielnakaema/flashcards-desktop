import { cardRepository } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";

export const useCardStats = () =>
  useQuery({
    queryKey: cardsQueryKeys.stats(),
    queryFn: () => cardRepository.getStats(new Date()),
  });
