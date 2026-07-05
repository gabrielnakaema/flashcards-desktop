import type { StudyQueueCounts } from "@/features/study/hooks/use-study-session";
import { cn } from "@/shared/lib/utils";
import { ArrowLeftIcon } from "lucide-react";

interface StudyHeaderProps {
  deckTitle: string;
  counts: StudyQueueCounts;
  reviewed: number;
  total: number;
  onBack: () => void;
}

export const StudyHeader = ({
  deckTitle,
  counts,
  reviewed,
  total,
  onBack,
}: StudyHeaderProps) => {
  const progressPercent =
    total > 0 ? Math.min(100, (reviewed / total) * 100) : 0;

  const headerCounts = [
    { label: "New", value: counts.new, color: "text-info" },
    { label: "Learning", value: counts.learning, color: "text-warning" },
    { label: "Review", value: counts.review, color: "text-success" },
  ];

  return (
    <header className="border-b border-border/60 bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Exit study"
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
          </button>
          <span className="font-mono text-sm font-bold text-foreground">
            {deckTitle}
          </span>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {headerCounts.map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className={cn("text-sm font-semibold", color)}>
                {value}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "font-mono text-xs text-muted-foreground",
            total > 0 && "text-foreground"
          )}
        >
          <span key={reviewed} className="study-progress-pop inline-block">
            {reviewed}
          </span>
          <span className="text-muted-foreground">/{total}</span>
        </div>
      </div>

      <div className="h-0.5 w-full overflow-hidden bg-border/40">
        <div
          className="h-full rounded-r-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
          aria-hidden="true"
        />
      </div>
    </header>
  );
};
