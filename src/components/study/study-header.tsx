import { Button } from "@/components/ui/button";
import type { StudyQueueCounts } from "@/hooks/study/use-study-session";
import { cn } from "@/lib/utils";
import { TimerIcon, XIcon } from "lucide-react";

interface StudyHeaderProps {
  deckTitle: string;
  counts: StudyQueueCounts;
  reviewed: number;
  total: number;
  onBack: () => void;
}

const counterClasses =
  "flex min-w-12 flex-col items-center gap-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground";

export const StudyHeader = ({
  deckTitle,
  counts,
  reviewed,
  total,
  onBack,
}: StudyHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Exit study"
          type="button"
          onClick={onBack}
        >
          <XIcon className="size-4" />
        </Button>
        <p className="text-sm font-bold text-primary md:text-base">
          {deckTitle}
        </p>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <div className={counterClasses}>
          <span className="text-sm text-foreground">{counts.new}</span>
          New
        </div>
        <div className={counterClasses}>
          <span className="text-sm text-foreground">{counts.learning}</span>
          Learning
        </div>
        <div className={counterClasses}>
          <span className="text-sm text-foreground">{counts.review}</span>
          Review
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-muted-foreground",
          total > 0 && "text-foreground"
        )}
      >
        <TimerIcon className="size-4 text-primary" />
        {reviewed}/{total}
      </div>
    </header>
  );
};
