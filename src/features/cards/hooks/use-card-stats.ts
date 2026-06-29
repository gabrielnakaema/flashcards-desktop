import { cardStatisticsRepository } from "@/data/repositories";
import { timeDependentQueryOptions } from "@/shared/lib/time-dependent-query-options";
import { useQuery } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";

export const useCardStats = () =>
  useQuery({
    queryKey: cardsQueryKeys.stats(),
    queryFn: () => cardStatisticsRepository.getStats(new Date()),
    ...timeDependentQueryOptions,
  });
