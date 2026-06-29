import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CardForm } from "@/features/cards/components/card-form/card-form";
import { useSuspendCard } from "@/features/cards/hooks/use-suspend-card";
import { useBuryCard } from "@/features/study/hooks/use-bury-card";
import type { StudyShortcutItem } from "@/features/study/hooks/use-study-keyboard-shortcuts";
import type { CardWithSchedule } from "@/features/cards/types";
import { KeyboardIcon, MoonIcon, PauseIcon, PencilIcon } from "lucide-react";

const getTomorrowMidnight = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

interface StudyActionBarProps {
  shortcutItems: StudyShortcutItem[];
  currentCard: CardWithSchedule | null;
  deckId: string;
  onSkip: () => void;
  isStudySubmitting?: boolean;
}

export const StudyActionBar = ({
  shortcutItems,
  currentCard,
  deckId,
  onSkip,
  isStudySubmitting,
}: StudyActionBarProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { suspend, isPending: isSuspending } = useSuspendCard({
    onSuccess: onSkip,
  });
  const { bury, isPending: isBurying } = useBuryCard({ onSuccess: onSkip });

  const isDisabled =
    !currentCard || isStudySubmitting || isSuspending || isBurying;

  return (
    <>
      <div
        aria-label="Study actions"
        className="mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-border bg-muted/70 p-1"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 px-3 text-xs"
              aria-label="Keyboard shortcuts"
            >
              <KeyboardIcon className="size-4" />
              <span className="hidden sm:inline">Keyboard shortcuts</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="center" side="top" className="w-80">
            <PopoverHeader>
              <PopoverTitle>Keyboard shortcuts</PopoverTitle>
            </PopoverHeader>
            {shortcutItems.length > 0 ? (
              <ul
                aria-label="Available keyboard shortcuts"
                className="grid gap-2"
              >
                {shortcutItems.map((item) => (
                  <li
                    key={`${item.label}-${item.keys.join("-")}`}
                    className="flex items-center justify-between gap-4 rounded-md bg-muted/60 px-3 py-2"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No keyboard shortcuts are available right now.
              </p>
            )}
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          onClick={() => setIsEditDialogOpen(true)}
          className="gap-2 px-3 text-xs"
        >
          <PencilIcon className="size-4" />
          <span className="hidden sm:inline">Edit Card</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          onClick={() => currentCard && suspend(currentCard.id)}
          className="gap-2 px-3 text-xs"
        >
          <PauseIcon className="size-4" />
          <span className="hidden sm:inline">Suspend</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          onClick={() =>
            currentCard &&
            bury({ cardId: currentCard.id, dueAt: getTomorrowMidnight() })
          }
          className="gap-2 px-3 text-xs"
        >
          <MoonIcon className="size-4" />
          <span className="hidden sm:inline">Bury Until Tomorrow</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit flashcard</DialogTitle>
            <DialogDescription>
              Update this flashcard without leaving study mode.
            </DialogDescription>
          </DialogHeader>
          {currentCard && (
            <CardForm
              card={currentCard}
              deckId={deckId}
              onSuccess={() => setIsEditDialogOpen(false)}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
