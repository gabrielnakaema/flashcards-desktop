import { CreateDeckForm, createDeckSchema } from "@/schemas/create-deck-schema";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deckRepository } from "@/data/repositories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decksQueryKeys } from "./decks-query-keys";
import { useListDeckCategories } from "./use-list-deck-categories";

const repo = deckRepository;

export const useCreateDeckForm = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const { data: categories } = useListDeckCategories();

  const formMethods = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
    defaultValues: {
      title: "",
      tags: "",
      categoryId: "",
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: repo.createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decksQueryKeys.all });
      formMethods.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      formMethods.setError("root", { message: error.message });
    },
  });

  const submit: SubmitHandler<CreateDeckForm> = async (data) => {
    mutation.mutate({
      categoryId: data.categoryId,
      title: data.title,
      tags: data.tags?.split(",").map((t) => t.trim()) ?? [],
    });
  };

  return {
    formMethods,
    submit,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    categories,
  };
};
