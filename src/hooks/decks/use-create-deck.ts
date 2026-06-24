import { deckRepository } from "@/data/repositories";
import { useMutation } from "@tanstack/react-query";

export const useCreateDeck = () => {
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: deckRepository.createDeck,
  });

  return {
    create: mutate,
    isPending,
    isError,
    error,
  };
};
