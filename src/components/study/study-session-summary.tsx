import { Button } from "@/components/ui/button";
import type { StudySessionStats } from "@/hooks/study/use-study-session";
import { cn } from "@/lib/utils";
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
    { label: "Correct", value: stats.correct, className: "text-green-200" },
    { label: "Again", value: stats.again, className: "text-red-200" },
  ];

  return (
    <section className="study-enter relative mx-auto flex w-full max-w-xl flex-col items-center gap-6 overflow-hidden rounded-lg border border-border bg-card p-8 text-center shadow-2xl">
      <div
        aria-hidden="true"
        className="study-summary-glow absolute -top-24 h-48 w-48 rounded-full bg-green-400/15 blur-3xl"
      />
      <div className="study-correct-pop relative flex size-16 items-center justify-center rounded-full border border-green-400/30 bg-green-500/10 text-green-200 shadow-lg shadow-green-500/10">
        <CheckCircle2Icon className="size-9" />
        <SparklesIcon className="absolute -right-1 -top-1 size-5 text-green-100" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Study session complete
        </h1>
        <p className="text-sm text-muted-foreground">
          Next due: {formatNextDueAt(stats.nextDueAt)}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {summaryItems.map((item, index) => (
          <div
            key={item.label}
            className="study-enter rounded-lg border border-border bg-muted/40 p-4"
            style={{ "--study-stagger": index } as CSSProperties}
          >
            <p className={cn("text-2xl font-bold", item.className)}>
              {item.value}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={onBack}
        size="lg"
        className="transition-transform duration-200 hover:-translate-y-0.5"
      >
        Go back
      </Button>
    </section>
  );
};
