import { cardStatisticsRepository } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";
import { cardsQueryKeys } from "./cards-query-keys";

export const useStreak = () =>
  useQuery({
    queryKey: cardsQueryKeys.streak(),
    queryFn: () => cardStatisticsRepository.getStreak(),
  });
