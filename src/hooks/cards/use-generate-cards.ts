import { getLlmProvider } from "@/providers/llm-provider";
import { useMutation } from "@tanstack/react-query";

const llmProvider = getLlmProvider("openai");

export const useGenerateCards = () => {
  const mutation = useMutation({
    mutationFn: llmProvider.generateCards,
  });

  return mutation;
};
