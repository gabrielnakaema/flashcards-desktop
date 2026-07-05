import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useDeckDetails } from "../hooks/use-deck-details";
import { DeckForm } from "./deck-form";

interface EditDeckPageContentProps {
  deckId: string;
}

export const EditDeckPageContent = ({ deckId }: EditDeckPageContentProps) => {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const { data: deck, isLoading, isError } = useDeckDetails(deckId);

  const handleBack = () => {
    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-background">
        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
      </div>
    );
  }

  if (isError || !deck) {
    return (
      <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-background">
        <p className="text-sm text-destructive font-mono">Failed to load deck.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1 bg-background">
      <button
        type="button"
        onClick={handleBack}
        className="text-xs text-muted-foreground font-mono tracking-tight hover:text-foreground transition-colors flex items-center gap-1 py-2"
      >
        <ChevronLeft className="size-4" />
        back to deck
      </button>

      <h1 className="text-lg font-semibold text-foreground tracking-tight">
        Edit deck
      </h1>

      <DeckForm deck={deck} onSuccess={handleBack} onCancel={handleBack} />
    </div>
  );
};
