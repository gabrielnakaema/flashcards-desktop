import { Button } from "@/components/ui/button";
import type { StudySessionStats } from "@/hooks/study/use-study-session";
import { CheckCircle2Icon } from "lucide-react";

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
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center shadow-2xl">
      <CheckCircle2Icon className="size-12 text-green-300" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Study session complete
        </h1>
        <p className="text-sm text-muted-foreground">
          Next due: {formatNextDueAt(stats.nextDueAt)}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-2xl font-bold">{stats.reviewed}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reviewed
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-2xl font-bold">{stats.correct}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Correct
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-2xl font-bold">{stats.again}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Again
          </p>
        </div>
      </div>

      <Button type="button" onClick={onBack} size="lg">
        Go back
      </Button>
    </section>
  );
};
