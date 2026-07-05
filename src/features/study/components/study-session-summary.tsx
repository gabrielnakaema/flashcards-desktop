import { AppButton } from "@/shared/components/app-button";
import type { StudySessionStats } from "@/features/study/hooks/use-study-session";
import { cn } from "@/shared/lib/utils";
import { CheckCircle2Icon, SparklesIcon } from "lucide-react";
import type { CSSProperties } from "react";

interface StudySessionSummaryProps {
  stats: StudySessionStats;
  onBack: () => void;
}

const formatNextDueAt = (nextDueAt: string | null): string => {
  if (!nextDueAt) return "No upcoming due date recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(nextDueAt));
};

export const StudySessionSummary = ({
  stats,
  onBack,
}: StudySessionSummaryProps) => {
  const summaryItems = [
    { label: "Reviewed", value: stats.reviewed, className: "text-foreground" },
    { label: "Correct", value: stats.correct, className: "text-success" },
    { label: "Again", value: stats.again, className: "text-destructive" },
  ];

  return (
    <section className="study-enter relative mx-auto flex w-full max-w-xl flex-col items-center gap-6 overflow-hidden rounded-sm border border-border/60 bg-muted p-8 text-center shadow-lg">
      <div
        aria-hidden="true"
        className="study-summary-glow absolute -top-24 h-48 w-48 rounded-full bg-success/10 blur-3xl"
      />
      <div className="study-correct-pop relative flex size-14 items-center justify-center rounded-sm border border-success/30 bg-success/10 text-success shadow-lg">
        <CheckCircle2Icon className="size-8" />
        <SparklesIcon className="absolute -right-1 -top-1 size-4 text-success" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          Study session complete
        </h1>
        <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Next due: {formatNextDueAt(stats.nextDueAt)}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {summaryItems.map((item, index) => (
          <div
            key={item.label}
            className="study-enter rounded-sm border border-border/60 bg-background/60 p-4"
            style={{ "--study-stagger": index } as CSSProperties}
          >
            <p className={cn("text-2xl font-bold", item.className)}>
              {item.value}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <AppButton
        type="button"
        onClick={onBack}
        size="lg"
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        Go back
      </AppButton>
    </section>
  );
};
