import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResetDeckStudyProgress } from "@/hooks/study/use-reset-deck-study-progress";
import {
  advanceDevClock,
  clearDevClock,
  formatDevClockDisplayValue,
  formatDevClockInputValue,
  getDevClockTime,
  initializeDevClock,
  setDevClockTime,
} from "@/lib/dev-clock";
import { useQueryClient } from "@tanstack/react-query";
import { ClockIcon, MinusIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface DevStudyToolsProps {
  deckId: string;
}

const clockJumps = [
  { label: "+10m", durationMs: 10 * 60 * 1000 },
  { label: "+1d", durationMs: 24 * 60 * 60 * 1000 },
  { label: "+7d", durationMs: 7 * 24 * 60 * 60 * 1000 },
];

export const DevStudyTools = ({ deckId }: DevStudyToolsProps) => {
  const {
    resetDeckStudyProgress,
    isPending: isResetting,
    error: resetError,
  } = useResetDeckStudyProgress(deckId);
  const queryClient = useQueryClient();
  const [clockTimeMs, setClockTimeMs] = useState(() => getDevClockTime());
  const [timeInput, setTimeInput] = useState(() =>
    formatDevClockInputValue(getDevClockTime())
  );
  const [clockError, setClockError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const initializedTime = initializeDevClock();
    setClockTimeMs(initializedTime);
    setTimeInput(formatDevClockInputValue(initializedTime));
  }, []);

  const updateClock = (timeMs: number | null) => {
    queryClient.removeQueries();
    setClockTimeMs(timeMs);
    setTimeInput(formatDevClockInputValue(timeMs));
    setClockError(null);
  };

  const handleSetTime = () => {
    if (!timeInput.trim()) {
      handleClearTime();
      return;
    }

    try {
      updateClock(setDevClockTime(timeInput));
    } catch (err) {
      setClockError((err as Error).message);
    }
  };

  const handleAdvanceTime = (durationMs: number) => {
    updateClock(advanceDevClock(durationMs));
  };

  const handleClearTime = () => {
    clearDevClock();
    updateClock(null);
  };

  const handleConfirmReset = async () => {
    await resetDeckStudyProgress();
    setIsResetDialogOpen(false);
  };

  if (isMinimized) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="fixed bottom-20 right-4 z-50 shadow-xl"
        onClick={() => setIsMinimized(false)}
      >
        <ClockIcon className="size-3.5" />
        Show dev tools
        <span className="text-xs text-muted-foreground">
          {formatDevClockDisplayValue(clockTimeMs)}
        </span>
      </Button>
    );
  }

  return (
    <>
      <aside
        aria-label="Developer study tools"
        className="fixed bottom-20 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Dev study tools</h2>
            <p className="text-xs text-muted-foreground">
              {formatDevClockDisplayValue(clockTimeMs)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-600">
              Dev
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Minimize developer study tools"
              onClick={() => setIsMinimized(true)}
            >
              <MinusIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="dev-clock-time"
            className="text-xs font-medium text-muted-foreground"
          >
            Custom time
          </label>
          <div className="flex gap-2">
            <Input
              id="dev-clock-time"
              type="datetime-local"
              value={timeInput}
              onChange={(event) => setTimeInput(event.target.value)}
              className="text-xs"
            />
            <Button type="button" size="sm" onClick={handleSetTime}>
              <ClockIcon className="size-3.5" />
              Set
            </Button>
          </div>
          {clockError && (
            <p role="alert" className="text-xs text-destructive">
              {clockError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {clockJumps.map((jump) => (
              <Button
                key={jump.label}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleAdvanceTime(jump.durationMs)}
              >
                {jump.label}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearTime}
            >
              Real time
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsResetDialogOpen(true)}
          >
            <RotateCcwIcon className="size-3.5" />
            Reset study progress
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        title="Reset study progress for this deck?"
        description="This clears review history and returns every card in this deck to a new, due-now study state. Cards and deck content are preserved."
        confirmLabel="Reset progress"
        pendingLabel="Resetting..."
        cancelLabel="Cancel"
        variant="destructive"
        isPending={isResetting}
        error={resetError?.message}
        onConfirm={handleConfirmReset}
      />
    </>
  );
};
